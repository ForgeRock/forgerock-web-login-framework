import { FRStep, CallbackType } from '@forgerock/javascript-sdk';

import Input from './name.svelte';

const step = new FRStep({
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IkxvZ2luIiwib3RrIjoiZ3ZsajFmMnMwMWprbDlzYjRzOWMyb3E3ZDYiLCJhdXRoSW5kZXhUeXBlIjoic2VydmljZSIsInJlYWxtIjoiL2FscGhhIiwic2Vzc2lvbklkIjoiKkFBSlRTUUFDTURJQUJIUjVjR1VBQ0VwWFZGOUJWVlJJQUFKVE1RQUNNREUuKmV5SjBlWEFpT2lKS1YxUWlMQ0pqZEhraU9pSktWMVFpTENKaGJHY2lPaUpJVXpJMU5pSjkuWlhsS01HVllRV2xQYVVwTFZqRlJhVXhEU214aWJVMXBUMmxLUWsxVVNUUlJNRXBFVEZWb1ZFMXFWVEpKYVhkcFdWZDRia2xxYjJsYVIyeDVTVzR3TGk1VlZsUnVkMGszWVdkelFrcGtjbXhQYWxsNU9WWjNMazVOVDJkQ2VFTmtkMDgyVmxWUGVYRkZSWFZmTjBWTmVrMXFiMEY2YmxGUmJreHJZbXBVVERaelN6bGxObEpRZVhrM2MwRmtVMWhxTVhSUlRWcFpkRXBDVVZkYVIyVm5hakpoWlVKSVdWb3hNR0owWjJsS1lrbHJSRXhvYUdsNE1VSkxTVzFTT1VGamVrZGZjbUphWnpkSmFrSTVVa1ZRV2xCVWFVaDRTMWRtU1RGVVpUbFBiM2hIWWxKbFIwcElSMXBCVUZZMVJHTmtPV0ZqUVd0SmMybzVhaTFUTjJsTFNUSlZWMkppY2xGUFFXWmxkSE5pTXpOcWJ6WTFkWFJGU1RaZldUVmZlUzFDTFhVellXSlBMVGRTWm1OMVZEZFBZa0ZRTFd0VFUxSmxTQzB3WDJNNVIzQnRlRWxPWWpoVk1FWlJkakpyYWtWT2QwaENUV05oUlhSRVJ6aDZjbGxRVFdadloxaEJha05FTVVWelYydFBMV3BVT0doMFozVlJlV0ZSYWtsaFJHWlhZa1YxY2xndE5XbGZkbGd0UkhKNWNUaElYMFpqUVhOdlFtRTBTVjlrTkhwWlEzSnFielo1WldOcFNsUmZja05zTTJsSU1URXlRbXQ2U1c5NlFrVm9MVkYyTm10c1ZtaHNVVWh1WDNob2FtUlViSFozWVdNMk0wbE9Ta0ZKU25sUlEzVk1SekJJYVZRNVpsVmxRbDl2TjJWdlVXRTVXR3RoVmxkNFIyZEhNMlJ5YzJ0eFV6SkZhWE0yWWswd2EzZHhUazQ0VUdWSWQwNWhUVnAwUmxwZlNGcDBhR1pxWTNKaVdESnRkV3RZUlZSTlRtNUpYeTFpT0dkU1dXdFBNVEJyVlZsa2JXMTBNRWxtVWkxNGQyWTVjRkkxUVZreGQzQldTVmRrVDJKUVJVUXhUREJrV1VNek4zbHVjWGRSV1ZSTVRqSlhTaTFPYkZRMmFtRkhUbGgxV0hKcVltOVNkblpYUXpkbVpFOUxUa1prYUZSRFJqWXhSVmhGVVRocWVHbEdVRkl0WkVoeE9XaFVjbUZzUW05VGREQkxZVXAwVGxKcWVqZDJNRGd5YkVSa1UwUXllbnBzZEVSUlQwbHNSVWRmTWpkTU1HbFVOMnhGYjFwWk1YbzVjRlZQVTBWQ1VXdE5UM3BXU25ZM2RHb3RTalJHVERoTVIydFdWMlpEYm0wMGRqWnJMamxhY1RseFVHZExUVjkxUlZocVJXZDVaekV3VUZFLnllanI2Wk5qMDhCNy1UZE94OFF5WG9hMXNJNkZQRnBybGNYbDhnSWp5cTAiLCJleHAiOjE2NTQwMTIxMjMsImlhdCI6MTY1NDAxMTgyM30.mkbQCP-3K6KB0uWr3olXDxLShkmi8d1-KlArDfpomk0',
  callbacks: [
    {
      type: CallbackType.NameCallback,
      output: [{ name: 'prompt', value: 'User Name' }],
      input: [{ name: 'IDToken1', value: '' }],
      _id: 0,
    },
  ],
  stage: 'UsernamePassword',
  header: 'Sign In',
  description:
    'New here? <a href="#/service/Registration">Create an account</a><br><a href="#/service/ForgottenUsername">Forgot username?</a><a href="#/service/ResetPassword"> Forgot password?</a>',
});

export default {
  component: Input,
  title: 'Callbacks/Name',
  argTypes: {
    callback: { control: 'text' },
    inputName: { control: 'text' },
  },
};

export const Simple = {
  args: {
    callback: step.getCallbackOfType(CallbackType.NameCallback),
    inputName: 'nameCallback',
  },
};
