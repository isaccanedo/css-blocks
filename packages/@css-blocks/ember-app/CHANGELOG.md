# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.5.0](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/compare/v1.4.0...v1.5.0) (2020-09-16)


### Bug Fixes

* Pick up fix for opticss crash on unknown css declarations. ([55f2245](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/55f2245d810506bdda78e69ea65d4bebcc2ed1c2))
* Prune css-blocks.css from the output after concatenating it. ([a663364](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/a6633648842049a2c01b8105347ede6548e5097d))


### Features

* Add file+loc to class name conflict error. ([82e4cfd](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/82e4cfd2fbf43e0678eb412a99171fefae021afa))
* Class name collision detection. ([31afe26](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/31afe264e71fe07cc2abadf711c72e77095ba498))
* Scan app CSS for classes. ([3ec0216](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/3ec021656d4a5d2a9eabc1c6abdb880daccc75e7))





# [1.4.0](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/compare/v1.3.2...v1.4.0) (2020-09-04)


### Bug Fixes

* Spelling - brocolli -> broccoli. ([a745147](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/a7451478b29f768276efe0bbc7b0bede2aedaab0))
* Updates per PR feedback. ([e6a4d94](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/e6a4d94c1743516968e1063f43dd43938b87d272))


### Features

* End-to-end sourcemaps for ember v2 pipeline. ([fec42e4](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/fec42e4e5c019c7c9a0a88d12a07acaec0a24baa))
* Provide ability to override concat settings. ([04a9da2](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/04a9da2b18abd3c7f3d26b2e673b9d019b172151))
* Update concatenation. WIP sourcemaps fix. ([da47ce6](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/da47ce6c3ea46056e5575d2a7cdfc001954e4a36))





## [1.3.2](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/compare/v1.3.1...v1.3.2) (2020-08-20)

**Note:** Version bump only for package @css-blocks/ember-app





# [1.3.0](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/compare/v1.2.4...v1.3.0) (2020-08-11)


### Bug Fixes

* Extract StyleEvaluator, StyleResolver classes from runtime service. ([282f90d](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/282f90de9714b36e1b5fdbbdff422005d5ccd257))
* Sometimes there's no css blocks output. ([1adbd1b](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/1adbd1b42c4bb916d6ea8a2c719acd7a99f2d9eb))


### Features

* Emit attribute groups in the runtime aggregate rewrite data. ([901032b](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/901032b940ce4c8ce9ec5af578359bf94e7ae616))
* Simplify rewrite for dynamic attribute values. ([0717e93](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/0717e9365095e49f34857aaa373e8bc0fb69a492))





## [1.2.4](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/compare/v1.2.3...v1.2.4) (2020-08-05)

**Note:** Version bump only for package @css-blocks/ember-app





## [1.2.3](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/compare/v1.2.2...v1.2.3) (2020-08-05)


### Bug Fixes

* Prepare the new ember packages before publishing them. ([c5dc8bc](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/c5dc8bc1e2fc5be413fcdf3fcfff67919a2620f6))





## [1.2.2](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/compare/v1.2.1...v1.2.2) (2020-08-05)


### Bug Fixes

* Create the application services directory if it's not there. ([85c3560](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/85c3560d843fc3e58160a03be5e592aaf9fb5ee4))





## [1.2.1](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/compare/v1.2.0...v1.2.1) (2020-08-05)


### Bug Fixes

* Add files that were missing from the new ember npm packages. ([b018382](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/b0183828bcbf5e0389d05dcdfca2db0e6a320bb8))





# [1.2.0](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/compare/v1.1.2...v1.2.0) (2020-08-05)


### Bug Fixes

* A cleaner approach to getting access to css-blocks build output. ([318e79a](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/318e79a000dde66f3642ba27bb3c879d49cfb7e0))
* Address code review. Don't merge if an output file is specified. ([c145c9a](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/c145c9a1bf0cf1e62a8b14748d5d5a6f16ac2e38))
* Declaration merging is now correctly rewritten by the new runtime. ([860c823](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/860c823bd09e0eedd5a6aecad22caae27704550c))
* Egregious hack to make lazy engines work. ([5da2dda](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/5da2dda124499ff1b543ca79dd44a2b03eede0ba))
* Ensure the style requirements are satisfied. ([1869167](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/18691678c6e5a71140b97bc3d3aaface92796f29))
* Failing tests. ([7e199dd](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/7e199ddd601e5de94a6aa47bbf2fd0bc0309fa89))
* Linting errors. ([f320818](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/f320818491d4abcde8aa227ee032738db817e18a))
* Look for broccoli tree paths in additional scopes. ([cebbc59](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/cebbc59a8e5e0b8eb0c969755e8278934997063f))
* Only consider output styles that can possibly apply. ([35a2c5a](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/35a2c5a6316ec026bb3114fec0f9500b2bb19e2f))
* Only merge with app.css if it exists. ([a2572ed](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/a2572ed3944a8cd6ea9ee3a55aa7114a3eedb84b))
* Re-use precomiled css if available. Give compiled css to optimizer. ([5027298](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/502729859c7768daecceaab276d4cdfa80b24e63))
* Several inheritance and composition bugs. ([4f23cc3](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/4f23cc30774f954938af23821174f112bc9475a6))
* Slightly less hacky approach to working with lazy engines. ([c3aec23](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/c3aec232bd42a58f3811310a71630264598ca865))
* Update debug message to output the correct value. ([4304fc5](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/4304fc509eecbc4d99da62f834cb8f27bee4e27d))
* Updates per PR feedback. ([df501f7](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/df501f76a20afe0b0e5b1d9c69877060f257239c))


### Features

* Basic runtime data generation with optimizer disabled. ([cabd495](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/cabd4957881662c1b7d383c8e173c168c4887f0c))
* Basic runtime helper build infrastructure and scaffolding. ([81d8853](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/81d885340087a627c5b31e20682c37f5d17aed06))
* Basic runtime style calculations working. ([50e84d1](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/50e84d118e8e4a413869589fd85bd78db582c06a))
* Centralize ember config and use it in ember & ember-app. ([85be93b](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/85be93bec7ce0cea26d12eadbf9822ebeab79a6c))
* Deserializing block definition files & analysis in the ember-app. ([ec338bf](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/ec338bf95ff214fcdaa52b619005d6cf36451801))
* Enable optimizer and runtime rewriting of optimized styles. ([af9efaa](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/af9efaaefec64fee3f3643d7acdaad3b756dc8ac))
* Establish ember-app addon. ([63f7e7e](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/63f7e7ef9ae47e3e51570dbf53f5625deb045ed7))
* Implied style runtime support. ([79f9141](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/79f9141aacddf954b6607e54b5724b7aeb82e5df))
* Optimized css in ember-app build output. ([c6ac1fd](https://github.com/linkedin/css-blocks/tree/master/packages/%40css-blocks/ember-app/commit/c6ac1fd93829ef20f2176665405c1c8ead90349a))
