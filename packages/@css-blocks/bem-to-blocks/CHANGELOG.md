# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.2.0](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/bem-to-blocks/compare/v1.1.2...v1.2.0) (2020-08-05)

**Note:** Version bump only for package @css-blocks/bem-to-blocks





## [1.1.2](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/bem-to-blocks/compare/v1.1.1...v1.1.2) (2020-07-20)

**Note:** Version bump only for package @css-blocks/bem-to-blocks





# [1.0.0](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/bem-to-blocks/compare/v1.0.0-alpha.7...v1.0.0) (2020-04-04)


### chore

* Drop support for node 6, 8, and 11. ([3806e82](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/bem-to-blocks/commit/3806e82124814fbea99aa47353cd2c171b1f55ec))


### BREAKING CHANGES

* Node 8 is now out of maintainence so we have dropped support for node 6
and 8. Node 11 is no longer needed because node 12 was released.





# [1.0.0-alpha.5](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/bem-to-blocks/compare/v1.0.0-alpha.4...v1.0.0-alpha.5) (2020-02-14)


### Bug Fixes

* Add pending test case for scss nesting. ([48396b2](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/bem-to-blocks/commit/48396b2f6e26beb6d7614f061dfe1ef83cf1b81a))
* Address race condition by simplifying main loop for BEM conversion. ([8116c7d](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/bem-to-blocks/commit/8116c7d652d7a4f242ea54329f3d8d9da25c45a8))
* Addressing Chris' comments. ([5df20f9](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/bem-to-blocks/commit/5df20f98c5e3b99273658d0ef99cd22a745769ed))
* Don't swallow any potential errors from postcss processing. ([7c5c15c](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/bem-to-blocks/commit/7c5c15c20d7fb8726e29695cd643a0d51d02b9e8))
* Incorrect :scope selector and state output. ([a11d572](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/bem-to-blocks/commit/a11d5720095a07dd72896f075d92891ac3c47196))
* Remove support for 'BME' selectors. ([db25c26](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/bem-to-blocks/commit/db25c2612a55a8df666389e3cc7b223261885a2f))


### Features

* Creating a new package for bem to css-blocks conversion. ([d62b204](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/bem-to-blocks/commit/d62b2042423d822c3b09526b145a354c4d7e6bd2))
* Making bem-to-blocks asynchronous. ([5319687](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/bem-to-blocks/commit/5319687ea72c2c90e5236ae7246654d9164433ad))
* Making the CLI interactive using inquirer.js. ([20c1f10](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/bem-to-blocks/commit/20c1f108b0c5c39adb84b821dfe7343e7b148765))
* Removing common prefixes from states, like, is. ([abdb3b1](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/bem-to-blocks/commit/abdb3b1336751904906a950d61091bef04b4eeec))
