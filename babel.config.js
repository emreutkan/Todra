module.exports = function (api) {
  api.cache(true);
  const isProduction = process.env.NODE_ENV === "production";

  return {
    presets: ["babel-preset-expo"],
    plugins: [
      isProduction && [
        "babel-plugin-transform-remove-console",
        { exclude: ["error", "warn"] },
      ],
      // IMPORTANT: Reanimated plugin must be listed last
      "react-native-reanimated/plugin",
    ].filter(Boolean),
  };
};
