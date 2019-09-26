const path = require('path');

module.exports = {
    entry: {
        'monitor': './src/app/MonitorApplication.tsx',
        'supplier': './src/app/SupplierApplication.ts',
        'tsp': './src/app/TspApplication.tsx',
        'tsp-servant': './src/test/tsp/internal/servant.ts'
    },
    output: {
        filename: '[name].min.js',
        path: path.resolve(__dirname, 'assets/js')
    },
    devtool: 'source-map',
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },    
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.s?css$/,
                use: [
                    "style-loader",
                    "css-loader?url=false",
                    "sass-loader"
                ]
            }
        ]
    },
    node: {
        fs: 'empty',
        child_process: 'empty'
    }
};