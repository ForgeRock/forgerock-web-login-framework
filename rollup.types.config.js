import dts from 'rollup-plugin-dts';

export default [
  {
    input: 'svelte-package/widget/types.d.ts',
    external: ['./main.css'],
    output: [
      {
        file: 'package/types.d.ts',
        format: 'es',
      },
    ],
    plugins: [
      dts({
        // we want to create a standalone bundle that does not have dependencies
        respectExternal: true,
      }),
    ],
  },
];
