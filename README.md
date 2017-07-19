
<h1 align="center">pkg-rename</h1>
<div align="center">
  <strong>CLI to quickly rename a npm package</strong>
</div>
<div align="center">
  <a href="https://npmjs.org/package/@tiaanduplessis/pkg-rename">
    <img src="https://img.shields.io/npm/v/@tiaanduplessis/pkg-rename.svg?style=flat-square" alt="npm package version" />
  </a>
  <a href="https://npmjs.org/package/@tiaanduplessis/pkg-rename">
  <img src="https://img.shields.io/npm/dm/@tiaanduplessis/pkg-rename.svg?style=flat-square" alt="npm downloads" />
  </a>
  <a href="https://github.com/feross/standard">
    <img src="https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square" alt="standard JS linter" />
  </a>
  <a href="https://github.com/prettier/prettier">
    <img src="https://img.shields.io/badge/styled_with-prettier-ff69b4.svg?style=flat-square" alt="prettier code formatting" />
  </a>
  <a href="https://travis-ci.org/tiaanduplessis/pkg-rename">
    <img src="https://img.shields.io/travis/tiaanduplessis/pkg-rename.svg?style=flat-square" alt="travis ci build status" />
  </a>
  <a href="https://github.com/tiaanduplessis/pkg-rename/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@tiaanduplessis/pkg-rename.svg?style=flat-square" alt="project license" />
  </a>
  <a href="http://makeapullrequest.com">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="make a pull request" />
  </a>
</div>
<br>
<div align="center">
  <a href="https://github.com/tiaanduplessis/pkg-rename/watchers">
    <img src="https://img.shields.io/github/watchers/tiaanduplessis/pkg-rename.svg?style=social" alt="Github Watch Badge" />
  </a>
  <a href="https://github.com/tiaanduplessis/pkg-rename/stargazers">
    <img src="https://img.shields.io/github/stars/tiaanduplessis/pkg-rename.svg?style=social" alt="Github Star Badge" />
  </a>
  <a href="https://twitter.com/intent/tweet?text=Check%20out%20pkg-rename!%20https://github.com/tiaanduplessis/pkg-rename%20%F0%9F%91%8D">
    <img src="https://img.shields.io/twitter/url/https/github.com/tiaanduplessis/pkg-rename.svg?style=social" alt="Tweet" />
  </a>
</div>
<br>
<div align="center">
  Built with ❤︎ by <a href="https://github.com/tiaanduplessis">tiaanduplessis</a> and <a href="https://github.com/tiaanduplessis/pkg-rename/contributors">contributors</a>
</div>

<h2>Table of Contents</h2>
<details>
  <summary>Table of Contents</summary>
  <li><a href="#install">Install</a></li>
  <li><a href="#usage">Usage</a></li>
  <li><a href="#contribute">Contribute</a></li>
  <li><a href="#license">License</a></li>
</details>

## Install

```sh
$ npm -g install @tiaanduplessis/pkg-rename
# OR
$ yarn add global @tiaanduplessis/pkg-rename
```

## Usage

`cd` into your package's directory **after renaming it**. You can then run:

```sh
$ pkg-rename old-package-name
# or 
$ pkg-rename --old=old-package-name
```

This will get the latest version of the old package from npm and deprecate this and all previous published versions with a message:

```
WARNING: This project has been renamed to new-package-name. Install using new-package-name instead.
```

`new-package-name` is retrieved from the closest `package.json`

You can also publish directly after: 

```sh
$ pkg-rename old-package-name --publish
```

## Contributing

Contributions are welcome!

1. Fork it.
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

Or open up [a issue](https://github.com/tiaanduplessis/pkg-rename/issues).

## License

Licensed under the MIT License.
