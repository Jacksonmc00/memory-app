/** @type {import('next').NextConfig} */
const postcssConfig = {
  plugins: {
    '@tailwindcss/postcss': {},
    // If you still get an error after installing, 
    // you can just remove 'autoprefixer': {} from here
  },
};

export default postcssConfig;