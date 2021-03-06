const fs = require('fs')
const util = require('util')
const path = require('path')
const { PER_PAGE, GITHUB_CLIENT } = require('./constants')
const readFile = util.promisify(fs.readFile)
const mkdirp = util.promisify(require('mkdirp'))

const readCache = cacheFile => readFile(cacheFile, 'utf8').then(JSON.parse)

const writeCache = (cacheFile, data) =>
  mkdirp(path.dirname(cacheFile)).then(() =>
    fs.writeFileSync(cacheFile, JSON.stringify(data), 'utf8')
  )

const fetchReleasesBatch = (page, options) =>
  new Promise((resolve, reject) => {
    const fetchOptions = {
      owner: options.owner,
      repo: options.repo,
      page: page,
      per_page: PER_PAGE
    }

    GITHUB_CLIENT.repos.listReleases(fetchOptions, (err, res) => {
      if (err) reject(err)
      else resolve(res.data)
    })
  })

const fetchReleases = async options => {
  let currentPage = 0
  let resultsLength = Infinity
  let releases = []

  while (resultsLength >= PER_PAGE) {
    const results = await fetchReleasesBatch(++currentPage, options)
    resultsLength = results.length
    releases = releases.concat(results)
  }

  return releases
}

module.exports = {
  getReleases: cacheFile => readCache(cacheFile),
  fetchReleases: async options => {
    const releases = await fetchReleases(options)
    writeCache(options.cacheFile, releases)
    return releases
  }
}
