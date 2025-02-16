import chai from 'chai'
import chaiString from 'chai-string'
import ncu from '../src/'
import { FilterFunction } from '../src/types/FilterFunction'
import { Index } from '../src/types/IndexType'
import { TargetFunction } from '../src/types/TargetFunction'
import { Version } from '../src/types/Version'

chai.should()
chai.use(chaiString)

process.env.NCU_TESTS = 'true'

describe('target', () => {
  it('do not update major versions with --target minor', async () => {
    const pkgData = await ncu({ target: 'minor', packageData: { dependencies: { chalk: '3.0.0' } } })
    pkgData!.should.not.have.property('chalk')
  })

  it('update minor versions with --target minor', async () => {
    const pkgData = (await ncu({
      target: 'minor',
      packageData: { dependencies: { chalk: '2.3.0' } },
    })) as Index<Version>
    pkgData!.should.have.property('chalk')
    pkgData.chalk.should.equal('2.4.2')
  })

  it('update patch versions with --target minor', async () => {
    const pkgData = (await ncu({
      target: 'minor',
      packageData: { dependencies: { chalk: '2.4.0' } },
    })) as Index<Version>
    pkgData!.should.have.property('chalk')
    pkgData.chalk.should.equal('2.4.2')
  })

  it('do not update major versions with --target patch', async () => {
    const pkgData = await ncu({ target: 'patch', packageData: { dependencies: { chalk: '3.0.0' } } })
    pkgData!.should.not.have.property('chalk')
  })

  it('do not update minor versions with --target patch', async () => {
    const pkgData = await ncu({ target: 'patch', packageData: { dependencies: { chalk: '2.3.2' } } })
    pkgData!.should.not.have.property('chalk')
  })

  it('update patch versions with --target patch', async () => {
    const pkgData = (await ncu({
      target: 'patch',
      packageData: { dependencies: { chalk: '2.4.1' } },
    })) as Index<Version>
    pkgData!.should.have.property('chalk')
    pkgData.chalk.should.equal('2.4.2')
  })

  it('skip non-semver versions with --target patch', async () => {
    const pkgData = await ncu({ target: 'patch', packageData: { dependencies: { test: 'github:a/b' } } })
    pkgData!.should.not.have.property('test')
  })

  it('custom target function to mimic semver', async () => {
    // eslint-disable-next-line jsdoc/require-jsdoc
    const target: TargetFunction = (name, [{ operator }]) =>
      operator === '^' ? 'minor' : operator === '~' ? 'patch' : 'latest'
    const pkgData = (await ncu({
      target,
      packageData: {
        dependencies: {
          'eslint-plugin-jsdoc': '~36.1.0',
          jsonlines: '0.1.0',
          juggernaut: '1.0.0',
          mocha: '^8.3.2',
        },
      },
    })) as Index<Version>
    pkgData!.should.have.property('eslint-plugin-jsdoc')
    pkgData['eslint-plugin-jsdoc'].should.equal('~36.1.1')
    pkgData!.should.have.property('jsonlines')
    pkgData.jsonlines.should.equal('0.1.1')
    pkgData!.should.have.property('juggernaut')
    pkgData.juggernaut.should.equal('2.1.1')
    pkgData!.should.have.property('mocha')
    pkgData.mocha.should.equal('^8.4.0')
  })

  it('custom target and filter function to mimic semver', async () => {
    // eslint-disable-next-line jsdoc/require-jsdoc
    const target: TargetFunction = (name, [{ operator }]) =>
      operator === '^' ? 'minor' : operator === '~' ? 'patch' : 'latest'
    // eslint-disable-next-line jsdoc/require-jsdoc
    const filter: FilterFunction = (_, [{ major, operator }]) =>
      !(major === '0' || major === undefined || operator === undefined)
    const pkgData = (await ncu({
      filter,
      target,
      packageData: {
        dependencies: {
          'eslint-plugin-jsdoc': '~36.1.0',
          jsonlines: '0.1.0',
          juggernaut: '1.0.0',
          mocha: '^8.3.2',
        },
      },
    })) as Index<Version>
    pkgData!.should.have.property('eslint-plugin-jsdoc')
    pkgData['eslint-plugin-jsdoc'].should.equal('~36.1.1')
    pkgData!.should.not.have.property('jsonlines')
    pkgData!.should.not.have.property('juggernaut')
    pkgData!.should.have.property('mocha')
    pkgData.mocha.should.equal('^8.4.0')
  })

  it('do not require --pre with --target newest', () => {
    return ncu({
      jsonAll: true,
      packageData: {
        dependencies: {
          'ncu-mock-pre': '1.0.0',
        },
      },
      target: 'newest',
    }).then(data => {
      return data!.should.eql({
        dependencies: {
          'ncu-mock-pre': '2.0.0-alpha.0',
        },
      })
    })
  })

  it('do not require --pre with --target greatest', () => {
    return ncu({
      jsonAll: true,
      packageData: {
        dependencies: {
          'ncu-mock-pre': '1.0.0',
        },
      },
      target: 'greatest',
    }).then(data => {
      return data!.should.eql({
        dependencies: {
          'ncu-mock-pre': '2.0.0-alpha.0',
        },
      })
    })
  })

  it('allow --pre 0 with --target newest to exclude prereleases', () => {
    return ncu({
      jsonAll: true,
      packageData: {
        dependencies: {
          'ncu-mock-pre': '1.0.0',
        },
      },
      target: 'newest',
      pre: false,
    }).then(data => {
      return data!.should.eql({
        dependencies: {
          'ncu-mock-pre': '1.0.0',
        },
      })
    })
  })

  it('work with --target newest with any invalid or wildcard range', () => {
    return Promise.all([
      ncu({
        jsonAll: true,
        target: 'newest',
        packageData: {
          dependencies: {
            del: '',
          },
        },
      }),
      ncu({
        jsonAll: true,
        target: 'newest',
        packageData: {
          dependencies: {
            del: 'invalid range',
          },
        },
      }),
      ncu({
        jsonAll: true,
        target: 'newest',
        packageData: {
          dependencies: {
            del: '*',
          },
        },
      }),
      ncu({
        jsonAll: true,
        target: 'newest',
        packageData: {
          dependencies: {
            del: '~',
          },
        },
      }),
    ])
  })
}) // end 'target'

describe('distTag as target', () => {
  it('upgrade nonprerelease version to specific tag', async () => {
    const upgraded = (await ncu({
      target: '@next',
      packageData: {
        dependencies: {
          'ncu-test-tag': '0.1.0',
        },
      },
    })) as Index<Version>

    upgraded['ncu-test-tag'].should.equal('1.0.0-1')
  })

  it('upgrade prerelease version without preid to nonprerelease', async () => {
    const upgraded = (await ncu({
      target: 'latest',
      packageData: {
        dependencies: {
          'ncu-test-tag': '1.0.0-1',
        },
      },
    })) as Index<Version>

    upgraded['ncu-test-tag'].should.equal('1.1.0')
  })

  it('upgrade prerelease version with preid to higher version on a specific tag', async () => {
    const upgraded = (await ncu({
      target: '@beta',
      packageData: {
        dependencies: {
          'ncu-test-tag': '1.0.0-task-42.0',
        },
      },
    })) as Index<Version>

    upgraded['ncu-test-tag'].should.equal('1.0.1-beta.0')
  })

  // can't detect which prerelease is higher, so just allow switching
  it('upgrade from prerelease without preid to prerelease with preid at a specific tag if major.minor.patch is the same', async () => {
    const upgraded = (await ncu({
      target: '@task-42',
      packageData: {
        dependencies: {
          'ncu-test-tag': '1.0.0-beta.0',
        },
      },
    })) as Index<Version>

    upgraded['ncu-test-tag'].should.equal('1.0.0-task-42.0')
  })

  // need to test reverse order too, because by base semver logic preid are sorted alphabetically
  it('upgrade from prerelease with preid to prerelease without preid at a specific tag if major.minor.patch is the same', async () => {
    const upgraded = (await ncu({
      target: '@next',
      packageData: {
        dependencies: {
          'ncu-test-tag': '1.0.0-task-42.0',
        },
      },
    })) as Index<Version>

    upgraded['ncu-test-tag'].should.equal('1.0.0-1')
  })

  // comparing semver between different dist-tags is incorrect, both versions could be released from the same latest
  // so instead of looking at numbers, we should focus on intention of the user upgrading to specific dist-tag
  it('downgrade to tag with a non-matching preid and lower patch', async () => {
    const upgraded = (await ncu({
      target: '@task-42',
      packageData: {
        dependencies: {
          'ncu-test-tag': '1.0.1-beta.0',
        },
      },
    })) as Index<Version>

    upgraded['ncu-test-tag'].should.equal('1.0.0-task-42.0')
  })

  // same as previous, doesn't matter if it's patch, minor or major, comparing different dist-tags is incorrect
  it('downgrade to tag with a non-matching preid and lower minor', async () => {
    const upgraded = (await ncu({
      target: '@next',
      packageData: {
        dependencies: {
          'ncu-test-tag': '1.2.0-dev.0',
        },
      },
    })) as Index<Version>

    upgraded['ncu-test-tag'].should.equal('1.0.0-1')
  })

  it('do not downgrade nonprerelease version to lower version with specific tag', async () => {
    const upgraded = await ncu({
      target: '@next',
      packageData: {
        dependencies: {
          'ncu-test-tag': '1.1.0',
        },
      },
    })

    upgraded!.should.not.have.property('ncu-test-tag')
  })

  it('do not downgrade to latest with lower version', async () => {
    const upgraded = await ncu({
      target: 'latest',
      packageData: {
        dependencies: {
          'ncu-test-tag': '1.1.1-beta.0',
        },
      },
    })

    upgraded!.should.not.have.property('ncu-test-tag')
  })
}) // end 'distTag as target'
