# multiverse-vis

## Installation

To install this library please first ensure that you have `npm` installed.

Then run the following code:

```
git clone https://github.com/abhsarma/multiverse-vis
cd multiverse-vis
npm install
```


## Development

To contribute to this repository please pick an issue, assign it to yourself and reference it in the branch name. Once you have solved it, please make a pull request and assign @abhsarma to review the code!

To watch for changes and continually rebuild the package (this is useful if you're using npm link to test out changes in a project locally):

```
npm run dev
```


## Compilation

Currently, we are working on an implementation which lets you compile this project into a standalone HTML file. To do this, run the following command:

```
npm run compile
```

This will create a `template.html` file, which will work as a standalone HTML document.

### Troubleshooting

To compile, we make use of the inliner npm library. However, inliner does not support `defer` scripts. So in the `public/index.html` file, move:

```
<head>
    <script defer src="/build/bundle.js"></script>
</head>
```

to **after** the `<body/>` tag:

```
    <body></body>
    <script src="/build/bundle.js"></script>
</html>
```




