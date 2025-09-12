module.exports = function (api) {
  api.cache(true);
  const isProduction = process.env.NODE_ENV === "production";

  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Use worklets plugin instead of reanimated plugin (reanimated plugin moved to worklets)
      "react-native-worklets/plugin",
      isProduction && [
        "babel-plugin-transform-remove-console",
        { exclude: ["error", "warn"] },
      ],
    ].filter(Boolean),
  };
};
