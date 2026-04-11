module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.optimization = {
        ...webpackConfig.optimization,
        splitChunks: {
          chunks: "all",
          minSize: 10000,
          maxSize: 250000,
        },
      };
      return webpackConfig;
    },
  },
  devServer: {
    hot: false,
    liveReload: true,
  },
};
