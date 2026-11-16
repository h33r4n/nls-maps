// Adds API keys from GitHub Secrets at build time. Nothing secret lives in the repo.
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    tomtomKey: process.env.TOMTOM_KEY || '',
    vicRoadsKey: process.env.VIC_ROADS_KEY || '',
    ptvDevId: process.env.PTV_DEV_ID || '',
    ptvKey: process.env.PTV_KEY || '',
  },
});
