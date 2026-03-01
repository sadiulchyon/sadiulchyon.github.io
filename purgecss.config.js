// purgecss.config.js — configuration for PurgeCSS, a tool that removes unused
// CSS from the built site (_site/) to reduce stylesheet file size.
// Run manually after `jekyll build` with: npx purgecss --config purgecss.config.js
module.exports = {
  content: ["_site/**/*.html", "_site/**/*.js"],
  css: ["_site/assets/css/*.css"],
  output: "_site/assets/css/",
  skippedContentGlobs: ["_site/assets/**/*.html"],
};
