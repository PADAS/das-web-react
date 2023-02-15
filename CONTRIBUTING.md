# EarthRanger - Code Contribution Policy

Contributing to EarthRanger is highly encouraged. As an open source project, EarthRanger is dedicated to transparency, security, and the greater EarthRanger community.

Please ensure that all participation in EarthRanger development adheres to our [code of conduct](CODE_OF_CONDUCT_LINK_HERE), and is a good faith effort towards the improvement of conservation technology.

Please consider the following before filing a pull request to merge your contribution:

1. Is the contribution specific to your site, or broadly useful in the conservation community? If it is the former, consider writing the feature as an integration, or running a fork of EarthRanger with your modified code.
2. Can you support potential bugs and requests surrounding the feature?

---


# Contributing to EarthRanger
Contributing to EarthRanger is highly encouraged. As an open source project, EarthRanger is dedicated to transparency, security, and the greater EarthRanger community.

Please ensure that all participation in EarthRanger development adheres to our code of conduct, and is a good faith effort towards the improvement of conservation technology.

You are welcome to contribute to EarthRanger in a number of ways, including:
- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## We Develop with Github
We use Github to host code, to track issues and feature requests, as well as accept pull requests.

## We Use [Github Flow](https://docs.github.com/en/get-started/quickstart/github-flow), So All Code Changes Happen Through Pull Requests
Pull requests are the best way to propose changes to the codebase (we use [Github Flow](https://guides.github.com/introduction/flow/index.html)). We actively welcome your pull requests:

1. Fork the repo and create your branch from `develop`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue a new pull request for the EarthRanger team to review

## Any contributions you make will be under the Apache License
In short, when you submit code changes, your submissions are understood to be under the same [Apache License](LINK_TO_LICENSE_FILE_HERE) that covers the project. Feel free to contact the maintainers if that's a concern.

## Report bugs using Github's [issues](https://github.com/briandk/transcriptase-atom/issues)
We use GitHub issues to track public bugs. Report a bug by [opening a new issue](); it's that easy!

**When filing a bug report**, make sure to include:
- A quick summary and/or background
- Highly specific reproduction steps
  - (and sample code, if/where possible)
- What you expected would happen
- What actually happens
- Notes
- Evidence - photos, screen recordings, logs, etc etc


## Coding Standards
* Contributions to EarthRanger require documentation and test coverage.
* Documentation can be in the form of self-describing code, with comments, or proposal documents included in the pull request.
* Project-wide test coverage should never regress as the result of a contribution, only maintain or increase overall coverage.
* Our codebase enforces code styles driven by ESLint, which generally follow best practices as per the Airbnb JavaScript code style guidelines and React best practices.
  * You can try running `npm run lint` to analyze and fix your code styles as necessary.
* The ultimate assessment of code standards is at the discretion of the EarthRanger team.


## The Lifecycle of a Pull Request
1. First a contributor will file their pull request, adhering to the standards of the pull request template. Reviewers may return the PR to the contributor if the template is not filled completely.
2. Reviewers within the EarthRanger core team will review the code, explore its functionality, and evaluate it. This is on an ad hoc basis, so no time boundaries are guaranteed, but we will always put in our best effort to review in a timely manner.
3. Comments, approvals, and change requests will be issued by the EarthRanger team's reviewers. If any changes are necessary, the pull request will be re-assigned to the contributor for further work and review. Once the contributor's work is ready for re-review, they simply click the "request re-review" button next to each reviewer's name to trigger another cycle of review.
4. Once work has been reviewed and approved by the EarthRanger core team, it will be merged into the `develop` branch where it will undergo full regression testing before releasing into production.

## License
By contributing, you agree that your contributions will be licensed under this project's Apache License.

## References
This document was adapted from the open-source contribution guidelines for [Facebook's Draft](https://github.com/facebook/draft-js/blob/a9316a723f9e918afde44dea68b5f9f39b7d9b00/CONTRIBUTING.md)
