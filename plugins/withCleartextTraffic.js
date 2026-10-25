const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Tillater klartekst (http://) i release-builds. Nødvendig for at appen
 * skal kunne koble til Dockhand-servere som kjører over vanlig HTTP
 * (f.eks. i lokalnett). Uten dette blokkerer Android 9+ HTTP-forespørsler.
 */
module.exports = function withCleartextTraffic(config) {
  return withAndroidManifest(config, async (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (application) {
      application.$['android:usesCleartextTraffic'] = 'true';
    }
    return config;
  });
};