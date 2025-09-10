module.exports = function (api) {
  api.cache(true);
  const isProduction = process.env.NODE_ENV === "production";

  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Keep this first per Reanimated docs
      "react-native-reanimated/plugin",
      isProduction && [
        "transform-remove-console",
        { exclude: ["error", "warn"] },
      ],
    ].filter(Boolean),
  };
};

