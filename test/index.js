'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const source = fs.readFileSync(path.join(__dirname, '..', 'index.js'), 'utf8')
const deprecationMessage = 'Successfully deprecated <=1.2.3 versions of old-package.'

// Run the CLI with every dependency replaced. No npm commands or registry
// requests can be executed by these tests.
async function run (options = {}) {
  const commands = []
  const output = []
  const errors = []
  const process = { exitCode: 0 }
  const dependencies = {
    'latest-version': async name => {
      assert.strictEqual(name, 'old-package')
      return '1.2.3'
    },
    'is-installed': async name => {
      assert.strictEqual(name, 'npm')
      return true
    },
    'read-pkg-up': async () => ({ pkg: { name: 'new-package' } }),
    'get-them-args': () => ({ unknown: ['old-package'], publish: options.publish !== false }),
    'shell-exec': command => {
      commands.push(command)
      if (commands.length === 1) {
        if (options.deprecateThrow) {
          throw options.deprecateThrow
        }
        if (options.deprecateError) {
          return Promise.reject(options.deprecateError)
        }
        return options.deprecateResult || { code: 0, stdout: '', stderr: '' }
      }
      assert.strictEqual(command, 'npm publish')
      assert.strictEqual(commands.length, 2)
      if (options.publishError) {
        return Promise.reject(options.publishError)
      }
      return options.publishResult || { code: 0, stdout: '', stderr: '' }
    }
  }

  if (options.defaultExport) {
    dependencies['shell-exec'] = { default: dependencies['shell-exec'] }
  }

  vm.runInNewContext(source, {
    require: name => {
      assert(Object.prototype.hasOwnProperty.call(dependencies, name), `Unexpected dependency: ${name}`)
      return dependencies[name]
    },
    process,
    console: {
      log: message => output.push(message),
      error: message => errors.push(String(message))
    }
  }, { filename: 'index.js' })

  // The CLI starts a promise chain without exporting it. Let its mocked async
  // dependencies settle before checking the resulting output and exit status.
  await new Promise(resolve => setImmediate(resolve))

  assert.strictEqual(commands[0], 'npm deprecate old-package@"<=1.2.3" "WARNING: This project has been renamed to new-package. Install using new-package instead."')
  return { commands, output, errors, exitCode: process.exitCode }
}

const tests = [
  ['successful publish retains the success message and zero exit status', async () => {
    const result = await run()
    assert.strictEqual(result.commands.length, 2)
    assert.deepStrictEqual(result.output, [deprecationMessage])
    assert.deepStrictEqual(result.errors, [])
    assert.strictEqual(result.exitCode, 0)
  }],
  ['failed publish reports stderr and propagates its exit code', async () => {
    const result = await run({ publishResult: { code: 17, stderr: 'npm ERR! 403 Forbidden', stdout: 'Publishing...' } })
    assert.deepStrictEqual(result.errors, ['npm ERR! 403 Forbidden'])
    assert.strictEqual(result.exitCode, 17)
    assert.deepStrictEqual(result.output, [deprecationMessage])
  }],
  ['failed publish falls back to stdout when stderr is empty', async () => {
    const result = await run({ publishResult: { code: 1, stderr: '', stdout: 'Publish failed' } })
    assert.deepStrictEqual(result.errors, ['Publish failed'])
    assert.strictEqual(result.exitCode, 1)
  }],
  ['failed publish with inherited output still reports failure', async () => {
    const result = await run({ publishResult: { code: 1, stderr: '', stdout: '' } })
    assert.deepStrictEqual(result.errors, ['npm publish failed'])
    assert.strictEqual(result.exitCode, 1)
  }],
  ['spawn errors returned by shell-exec are reported', async () => {
    const result = await run({ publishResult: { error: new Error('spawn sh ENOENT'), stderr: '', stdout: '' } })
    assert.deepStrictEqual(result.errors, ['Error: spawn sh ENOENT'])
    assert.strictEqual(result.exitCode, 1)
  }],
  ['rejected publish promises are reported as failures', async () => {
    const result = await run({ publishError: new Error('Cannot spawn shell') })
    assert.deepStrictEqual(result.errors, ['Error: Cannot spawn shell'])
    assert.strictEqual(result.exitCode, 1)
  }],
  ['signal termination cannot appear successful', async () => {
    // shell-exec v1 returns a null code when the process is killed by a signal.
    const result = await run({ publishResult: { code: null, stderr: '', stdout: '' } })
    assert.deepStrictEqual(result.errors, ['npm publish failed'])
    assert.strictEqual(result.exitCode, 1)
  }],
  ['missing publish status cannot appear successful', async () => {
    const result = await run({ publishResult: { stderr: '', stdout: '' } })
    assert.deepStrictEqual(result.errors, ['npm publish failed'])
    assert.strictEqual(result.exitCode, 1)
  }],
  ['publishing remains opt-in', async () => {
    const result = await run({ publish: false })
    assert.strictEqual(result.commands.length, 1)
    assert.deepStrictEqual(result.output, [deprecationMessage])
    assert.deepStrictEqual(result.errors, [])
    assert.strictEqual(result.exitCode, 0)
  }],
  ['failed deprecation does not attempt publishing', async () => {
    const result = await run({ deprecateResult: { code: 1 } })
    assert.strictEqual(result.commands.length, 1)
    assert.deepStrictEqual(result.output, [])
    assert.deepStrictEqual(result.errors, ['npm deprecate failed'])
    assert.strictEqual(result.exitCode, 1)
  }],
  ['failed deprecation reports stderr and propagates its exit code', async () => {
    const result = await run({ deprecateResult: { code: 17, stderr: 'npm ERR! EOTP', stdout: 'Deprecating...' } })
    assert.strictEqual(result.commands.length, 1)
    assert.deepStrictEqual(result.output, [])
    assert.deepStrictEqual(result.errors, ['npm ERR! EOTP'])
    assert.strictEqual(result.exitCode, 17)
  }],
  ['failed deprecation falls back to stdout', async () => {
    const result = await run({ deprecateResult: { code: 1, stderr: '', stdout: 'Deprecation failed' } })
    assert.strictEqual(result.commands.length, 1)
    assert.deepStrictEqual(result.output, [])
    assert.deepStrictEqual(result.errors, ['Deprecation failed'])
    assert.strictEqual(result.exitCode, 1)
  }],
  ['deprecation spawn errors take precedence over output', async () => {
    const result = await run({ deprecateResult: { error: new Error('spawn sh ENOENT'), stderr: 'stderr', stdout: 'stdout' } })
    assert.strictEqual(result.commands.length, 1)
    assert.deepStrictEqual(result.output, [])
    assert.deepStrictEqual(result.errors, ['Error: spawn sh ENOENT'])
    assert.strictEqual(result.exitCode, 1)
  }],
  ['deprecation errors cannot appear successful even with a zero code', async () => {
    const result = await run({ deprecateResult: { code: 0, error: new Error('Cannot spawn shell') } })
    assert.strictEqual(result.commands.length, 1)
    assert.deepStrictEqual(result.output, [])
    assert.deepStrictEqual(result.errors, ['Error: Cannot spawn shell'])
    assert.strictEqual(result.exitCode, 1)
  }],
  ['rejected deprecation promises stop before publishing', async () => {
    const result = await run({ deprecateError: new Error('Cannot spawn shell') })
    assert.strictEqual(result.commands.length, 1)
    assert.deepStrictEqual(result.output, [])
    assert.deepStrictEqual(result.errors, ['Error: Cannot spawn shell'])
    assert.strictEqual(result.exitCode, 1)
  }],
  ['synchronous deprecation errors stop before publishing', async () => {
    const result = await run({ deprecateThrow: new Error('Cannot spawn shell') })
    assert.strictEqual(result.commands.length, 1)
    assert.deepStrictEqual(result.output, [])
    assert.deepStrictEqual(result.errors, ['Error: Cannot spawn shell'])
    assert.strictEqual(result.exitCode, 1)
  }],
  ['deprecation signal termination cannot appear successful', async () => {
    const result = await run({ deprecateResult: { code: null, stderr: '', stdout: '' } })
    assert.strictEqual(result.commands.length, 1)
    assert.deepStrictEqual(result.output, [])
    assert.deepStrictEqual(result.errors, ['npm deprecate failed'])
    assert.strictEqual(result.exitCode, 1)
  }],
  ['missing deprecation status cannot appear successful', async () => {
    const result = await run({ deprecateResult: { stderr: '', stdout: '' } })
    assert.strictEqual(result.commands.length, 1)
    assert.deepStrictEqual(result.output, [])
    assert.deepStrictEqual(result.errors, ['npm deprecate failed'])
    assert.strictEqual(result.exitCode, 1)
  }],
  ['deprecation failures are reported without opting in to publishing', async () => {
    const result = await run({ publish: false, deprecateResult: { code: 1, stderr: 'npm ERR! EOTP' } })
    assert.strictEqual(result.commands.length, 1)
    assert.deepStrictEqual(result.output, [])
    assert.deepStrictEqual(result.errors, ['npm ERR! EOTP'])
    assert.strictEqual(result.exitCode, 1)
  }],
  ['shell-exec default exports report deprecation failures', async () => {
    const result = await run({ defaultExport: true, deprecateResult: { code: 1, stderr: 'npm ERR! EOTP' } })
    assert.strictEqual(result.commands.length, 1)
    assert.deepStrictEqual(result.output, [])
    assert.deepStrictEqual(result.errors, ['npm ERR! EOTP'])
    assert.strictEqual(result.exitCode, 1)
  }],
  ['shell-exec default exports can publish successfully', async () => {
    const result = await run({ defaultExport: true })
    assert.strictEqual(result.commands.length, 2)
    assert.deepStrictEqual(result.output, [deprecationMessage])
    assert.deepStrictEqual(result.errors, [])
    assert.strictEqual(result.exitCode, 0)
  }],
  ['shell-exec default exports report publish failures', async () => {
    const result = await run({ defaultExport: true, publishResult: { code: 1, stderr: 'npm ERR! 403 Forbidden' } })
    assert.deepStrictEqual(result.errors, ['npm ERR! 403 Forbidden'])
    assert.strictEqual(result.exitCode, 1)
  }]
]

async function main () {
  for (const [name, test] of tests) {
    await test()
    console.log(`ok - ${name}`)
  }
  console.log(`${tests.length} tests passed`)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
