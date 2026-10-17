// La web se puede publicar en una subcarpeta (por ejemplo GitHub Pages: /red-social1).
// BASE_URL=/red-social1 npx expo export -p web
module.exports = ({ config }) => ({
  ...config,
  experiments: { ...config.experiments, baseUrl: process.env.BASE_URL ?? '' },
});
