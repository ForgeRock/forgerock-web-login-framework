<script>
  import Image from './image.svelte';
</script>

# ForgeRock Web Login Framework

## WARNING: VAPORWARE

**This is a prototype of a development framework for generating a ForgeRock Login App for self-hosting or JavaScript Widget into an existing self-hosted SPA (React, Vue, Angular, etc.). This project is not officially supported and is not recommended for any product development. If you use this, you accept all the risks that come with completely unsupported software.**

<Image>

![Screenshot of modal Widget](/img/modal-widget-light.png)

</Image>

## Summary

This Web Login Framework is a development tool set for easily developing an alternative to the ForgeRock-hosted login application or building your own login application or component from scratch. The first product to be provided by this framework is the Login Widget which is a JavaScript component that can be installed into any modern JavaScript application. A future product provided by this framework will be a self-contained Login Application that can be self-hosted which will be useful as a centralized login app to your ecosystem of applications.

## ForgeRock Login Widget

The Login Widget is an embeddable JavaScript component that can be used within any modern JavaScript SPA (Single Page Application). It requires no "runtime" UI libraries or frameworks, so it can be used within a React, Angular, Vue, etc. application without any additional dependencies.

This Login Widget is compatible with ForgeRock AM trees or Identity Cloud journeys and their built-in nodes and their corresponding callbacks. [Please see our "Roadmap" section for current limitations and planned features](/docs/widget/roadmap).

[Please visit our "Widget Docs" for the quick-start and full API documentation](/docs/widget).

## Contributing to the Framework

If you'd like to contribute to the development of this framework, [please visit our "Contributing" docs for guidelines.](/docs/contributing).

## Disclaimer

> **This code is provided by ForgeRock on an “as is” basis, without warranty of any kind, to the fullest extent permitted by law. ForgeRock does not represent or warrant or make any guarantee regarding the use of this code or the accuracy, timeliness or completeness of any data or information relating to this code, and ForgeRock hereby disclaims all warranties whether express, or implied or statutory, including without limitation the implied warranties of merchantability, fitness for a particular purpose, and any warranty of non-infringement. ForgeRock shall not have any liability arising out of or related to any use, implementation or configuration of this code, including but not limited to use for any commercial purpose. Any action or suit relating to the use of the code may be brought only in the courts of a jurisdiction wherein ForgeRock resides or in which ForgeRock conducts its primary business, and under the laws of that jurisdiction excluding its conflict-of-law provisions.**

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
