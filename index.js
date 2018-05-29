#!/usr/bin/env node
'use strict'

const latestVersion = require('latest-version')
const isInstalled = require('is-installed')
const readPkgUp = require('read-pkg-up')
const sh = require('shell-exec')
const args = require('get-them-args')()
const oldName = args.old || args.unknown[0]

async function deprecatePrevName ({ oldName, publish }) {
  const version = await latestVersion(oldName)
  const result = await readPkgUp()

  if (!version) {
    console.error(`${oldName} does not exist in the registry`)
    return
  }

  if (result.pkg && result.pkg.name) {

    try {
      const deprecateResult = await sh(
        `npm deprecate ${oldName}@"<=${version}" "WARNING: This project has been renamed to ${result
          .pkg.name}. Install using ${result.pkg.name} instead."`
      )
  
      if (deprecateResult.code === 0) {
        console.log(`Successfully deprecated <=${version} versions of ${oldName}.`)
  
        if (publish) {
          await sh('npm publish')
        }
      }
    } catch(error) {
      console.error(error)
    }

  } else {
    console.error(
      `package.json could not be found. Please make sure you are in the correct directory`
    )
  }
}

if (oldName) {
  isInstalled('npm').then(exists => {
    if (exists) {
      deprecatePrevName({ oldName, publish: args.publish || false })
    } else {
      console.log('No npm installation detected')
    }
  })
} else {
  console.log('Please provide the old package name')
}
