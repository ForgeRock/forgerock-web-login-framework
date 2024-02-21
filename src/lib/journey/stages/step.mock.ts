import { type Step, CallbackType } from '@forgerock/javascript-sdk';

export const deviceProfileAloneData: Step = {
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IkRldmljZVByb2ZpbGUiLCJvdGsiOiJsbW1nZGg3bWQxOWowNWQ3bGltMjY2dmNkayIsImF1dGhJbmRleFR5cGUiOiJzZXJ2aWNlIiwicmVhbG0iOiIvYWxwaGEiLCJzZXNzaW9uSWQiOiIqQUFKVFNRQUNNRElBQkhSNWNHVUFDRXBYVkY5QlZWUklBQUpUTVFBQ01ERS4qZXlKMGVYQWlPaUpLVjFRaUxDSmpkSGtpT2lKS1YxUWlMQ0poYkdjaU9pSklVekkxTmlKOS5aWGxLTUdWWVFXbFBhVXBMVmpGUmFVeERTbXhpYlUxcFQybEtRazFVU1RSUk1FcEVURlZvVkUxcVZUSkphWGRwV1ZkNGJrbHFiMmxhUjJ4NVNXNHdMaTVYWTA1aU9ITmxVekIxUmtadFNFTXdXa2RLU0haM0xrSk5lRlZsUVVGclpWVkxiVlY1WWw5VFgyUm1kak5qY1U1d1VXWlVRV0pOU2kxak4xZFpTMUUwYm1GU1MwOHpiMlV5V25kU1JXWlRMVTFDVFhORVRVcGxNMUkzYWxoRE1tWmhRbGhHY3psdVdrRTVZbEp3WDBGeVVWa3lPV2hNUW1oclVURnZXVkIwYjFWdmFXSlNRWEkxZVVJMGRUbHlXbkZIVFVrMWJrVlRPV1poY3pSMFNYVkNWVXBrUVZCd2RFczRNV1pXVFdaU1dWVjVVVVowYW10NmQxRm9NRnAwVVMxTGVYaE5Rakp1Y0ZJNGJVbHNlbVpUVnpKWFpFUm9WMDFCZURWeFpYRkNTRlUyVTJwdlgyMHlkRVpLZG1OT2VVOWxlbVJNTTNFeFZVZFhTR1JpUWtoR1ZXMWpNamRPZUZaeldVeHZRa2x3TkZWVWJrZEZaek5MV0Zoc05qVnFWMjB3Y1dSeFNsQnlkVjloZG01TGJtdzRlVTVOU0ZGUVpreGpPVkF3V2tGZlJVSnBXR2xTVUVZeGFGUmZjRFpEZDNBMk5tZFhSVTlQV1V0R1NUSTBSVGRUVUdnM1NWY3lZV2QzV1ZOaFJXWjFSVWRmTTNFd1EzUkdSMk5xYW1nNVpVaGFVUzF1ZVRWUFJUVm9SVXd6YjNWcFUySTBaa2xwVGxjMFRtZzBaemwzYlVOR1QxbG9ZMlZKYURKdU5rUkpaRWMzVTJOQ2NHdE9hMWh6ZG1salFsTmhXRUUyZFdFeVJuSm1jVVEzY1RCUVpVMTFTa2R3WkVVNWMycG9iRmR0YkV4MVp5MXJXa3czYkhWMGJscDNZVU42YmtzNWFVcG5lV3RWVm1OMVJHWm5XRXBxZFdodGRXWnNkVFZ4U0VWak9GZFplSGd5WmpSek5pMVJOMGhoVkdsRUxVNTJaMFpZWnpaVlFqZGFWMmw0WlRsdFRVNUdaSFEzU1RjMVJXVkxOVzU2UW1sSUxUVlNObEZwV2sxTU5rdGZXalV0VVhOU1NtcFZZeTFhYTFwdFlUSkNVR1ZaVVhaVlpsTjFNMDFKTjJwcE1XUm5RbG95TVdwd2FHUlFVbU15WTNOUlozbzNYMkZNVlhGRlN6WjVObmRmWTJaSE5UaFViSFZoYTBOYVduTm9OV1pUVmtSMWVHRk1UMnRGYkRsUmRIUXlhMk5QZWxoRFpFRkxUV0YxY1hoS1NtVlFZUzFMVEd4QlZtTk1UbUozV0c1R1VHOXBXVGhzYjI1V00wbGtZamxYTkdKQ1QzSTJVa05uUlVKRlJUVkJRemwzU0dNNFdHZG1URXRHVVVkdWJEQlpNVU5rU2t0NVlTMXRiMDVUZERGbWFWYzBaMVpwY1hKelVtbzNVVmR4TjFwRU4zcHlVVGRIUlc5a09UZzBUREZEYVdnek1teHBNMng1T0RsV1VVMXFhbEJaTkVJekxWVkVkR1pPVDBsR1gwd3hUMDVEVFVSRGNtZEtTMWxEY1ZFdGQzWlJTSFI2YVc5M09WcHdNVlJZTWxsQ1FtNW9hRXBFVm5kTk1GbEtNMWhFWVVWVFNFMDVVMnRwTFdFME1HTmtZbVF0UW1ab2VYVnhRV2htVVdkbWF6VnlZVVpDYW1SMGNVbHhVRWcwVlRadmR6bFdSMlZ6VFdKcFJ6WkVVRkZYWmxGS1FsUnJVRWRrYUhGSFlYUmhabEkyZUhoV1Ztb3libFpQUzFSYVFUSnNZUzFDUkU5ZlgydHJhVE5PYUZGcmJFWmZOeTFaYVcxQlkyeEhPSFI1UjFSZmVGTndiRmg2V0c4M1pUZEthR2R6YVhBeGJFOXBkbU5ITW5aMk5tbG5PWFIxWXpONFJVbExWa2c1ZHpWelpVSjJSbEJRWm5GWGNtNHdXVmRrZVhkSVpUUnNkWHBwUTA5UVdGZzRSa2huVEMxU2JWQkZaV0Z6WTIxT2NEWmthRmhaTWtKTlkyTTJlVEJEWTFKSGRXWkNWVGRXVTNFdFgwdE1aV2QxYUdnMmVrcHZTVnBpUVdSWVVsSlpSMmRETWtOWFV6WkljSEZHZVhWc1RYUnBUWGsyVVZkc1IxbElXR2xIUkVWSWVVeENiM051YUhkdFFUWjJSekJVTlhCR1IwMW9NbkJIUlhZeWFqbGlWRXBZTlZoeFowSnNSR0UwUkdaWmFtdEVVa1pYVERGVFNFTkhVRTh5WlhsZlRtUjFNMmMwZUcxNlJqWllaSFJyTTFkMU4ybE9NREpqWmtkMlFrUk1Oa3BJY1U5MmMwdExPVUZvUlZCblZXaGxSVzFXWVMwME9VOXVWVEp3VVd4d1JTMXBlVTlpV2s1bFdEVnhOM3BYUTIxS1pHZEJUVUZQWTBWVlNubFFTalJCY2pGb1pHSnJRVlZyYTFCNFgweDFSRVoxY2tZM2JXUlpWa3RpWjA1RGFXbEthblpaUkY5alJ6VlNZa28xZWpKMWFtbGZWSFZqWVRaSWVGaHJWRzVLWVRkcGMyRlBNRXhyU25nNFduRklRa2xIZG1kRllWcDFNM054TVVKaWVGRk5NVVptUjFvM0xXeHplWEpPYld4NlZYTXRURTFXYUhacVVteHBZVGhZTlhob01tMXVOMEpCWHpka1dsUjFVVzFLVm0xUmJIWmxUM0pTUWpKcWJuQTJPREExT0ZKMFgxQTBlVXBRWWpjMlIySXRZbU13T0V0QmJHazFTbTVXUWsxRlFrbDJRV1JMYUhScGJHUktXRTFQTURrM1VIUm5halZzT0RSMmNIVnhlR001UmxGeE9XUnFVMFpzZDJkamVtY3hjblpSZDFkbGJ6ZFlibU5WWXpKU1RqRnZPR3hGVVhwVmQzaENhVXRIVVRad1VqTjRibGx5TTFScFlVZHlNbDlPTFhoNFdHOVlPR05HWmpsT1dHWmlVM3B1WlVObE5WZGFiVXR0TW1kdlRVeHBjMlp6TlVaamFFWXRORGhJV1VaQ2RWRXlkM0o1VUZWMlJFdEVSR2hCTWtwVGVHTmpVMjlDUkhOeFYxUTFSVU5IVlRaVlZWZERWVmhDY0RsdWRqRnFWM1J1VkhNdGJYUXliakJqUXpsSk5sbFlTRGhMUVd4WmEwUlpTMmx1ZW1WclJ6RnBMVVZpVm1GT04wMHhRa1ppZUY5VFR6QnVha281VGpCeVJIUkdiV1JFU21WV1FrRlZNVGhmY1ZGTFIwdEhURVJNYWtsM1oyMVlaVEZIZGtGSkxUaHJlbTFqVmw5MlpIVjBiRUpmZFZvM2VucGZORUpMYms5MVNGOVFUemQyUnpZMFNrdFhWbGRQWjFoeVduVTFSazR0ZVRsSWIxUm1ZbEpUY0ZSeUxXMU9URzFmVGs0MFFrMW9hRFJOTUY4NFZIZHFTVzlhYVVkcmFYWlhSWFEwUTIxT1N6aGtXSFZRUzJ4bk4yWlNNVmxFVTNvNWRIQm1RMUZ4UkhBNU5YVnJVRWRMWlY5M09WUjFiVFpVYjB4cE1GcE1heTAxWVdST1VtZHRWRUpYUkhwUWVHbE1jalZQTVRkM2NuZE9aVlYxYW5OMllVMVhVbXhKZVRaWlFVZHpSMkpFWTFGUVJ6WkZkMlo1UmpWRVZHUTNhbFZQVjFweWJuZFlja3BHYVhoNVJsaGZMWFUyUmkxWU1XNXhVbFp1Y25wVFJESnJXVXBvTWtaSmFERlRlbTFSTWs4d1ZFVmFRbVpwVEhBd09WQnVTazlRYWt0Mk9HaDNZbGRrY1RWTWRUbGlUemQwVGt4dGFGcFRUMHhuVkVoS1pHOUhWRzFKVW1oeVQzQXlUSEJLZEVwaVFXaHpja1U0ZEVGbU4zWTBkMHAwYUZWRVgySmZhMTlNVTJ4dVQxWk9XR05QTlhKb04wd3lVV3RTTFhCRlEzbzRaakJFZGxSTlZtbHdiMWxYTlZsTVVHUXRNbk5JTlZkWFNVRjFTMDFzYjNablkycFBOblE0TmxSVFJtSlRNRWRtZVhGWlVVMW1PRTR0TTJOVU5UTndhVzlZWkdadlNqbEdkSFEyVTBkTE9YWjNXVTFITTFrM01UVm1ZV052VDE5d2JGQTBiVjlGTTBsa2FrdEthRjh4T1cwNE9WSldUbXREVjB3MFpHVXhUbXh6YjNSVlJGRXhPVmx6YXkxVlNubDBjMFZzVkd3eGNVZHFVak15VVV0dk5VOXNYMmhQZVZWRlZUVTFkRUU1YUhWNk1ERkhhREoxV0dOcFFrbDNWVTFWYzFKSGNIQnpXVmxqTjBwbVExOWpielU0UkVaaFdTMDFSVUZ2YjBselVuUjNTVkZqYnpKV2NFRTFXWEJqTWpWdVZrczNjVmxGTmxwMWNYQk1iRXhpY0RCblZHcEROMVIwVUZWblNHVnRSMFpzYkhWcGRsRnpOWEJpV1ZwWFJWTnpkSGxwTTIxS1RrSnRPRGxNTWs1aU1VNUVOemhRVkVSNVJtZENRMEl0U1U5Sk5qaFhVbGxNYWtWSFIxUlZkWEEzUVdsbmQzRlJNVTV2VWkxT1MwaGpUMHgzTkVKYU5XbEVUSEl5TXpBd05GSmhNMll4VTIxNU1GQllOMWh4UmkxbU0zaFZlalIwVFZBeE5UZEtTRmx0WVVwcFFuYzROVmhMVjBSaGRXaFFMVnBvVFVneFlqWXpWa1UyU25rMldVNXRRMWRYTldZNVRIQmZNMWhGY2xoSVNEWnZWWGt6UTJwbFZIbHVlRlUyVUhacVEwNVpWazgyUzJKbmNEZFhWVFpTY2pSeVJURXdSbWczVVMxaWNrSmFVSGhDWTJSNlNtOXRSVEpDZGpFd1ZIQjJPV1J3TkUxdE5WbDVhVVF6UTBKd2FIcFdaVjh6Y0VWa1MwWlJSVTVvWTA1Wk1HdEVlR1pHT0dodWVucEhlbEJKT1ZkWFREYzRjV3hxYjI4MFNtTnRNRUpRVVhCV1dWbzBTVmhqWmt0WFJsWnNXa3R6TjJGVk5GbGtNa0V6UjJwck5tTk9UR055ZWt0dVVraHdUa2hwTldKc2JqWlBXbWcxTTJOcFJXNTRNVXRSTUhSUFZXZG9ibEpUTjI5dU9FTmtUbFJHWkRkUVIyUTFNV0pGZUhKVVdrZ3lZbmRWTldsd2RIY3dibXhIVUZBNVIxZzRTMk5pVW10eVIwUXlURUZGVVZOdWFtbHRkM1pYVlVkb1lVVlZOMVkxZEc1ck9HZDRTMk5rWTFOcFMySXpaelZhUlRRMVNFVlNMV2h0TlhaU2VWbHRRa1kxVmxSeU1uWkNVbFEwYlc1Nk9WSXdTblJEV2sxcWFrWlNhM1ozV0hZMFFXUkdORFpIYjJOSVlteHpZa1p2VW05VE5UZDFheTFCYzNFNFpHNUNSelUwWjFKaWRESk5Ta2xMVldkRGRFVm9ZbU4yWmkxSFVuY3hWa1kwTmtGUGNGZEJTQzFJTm05UE0weDZRMDlZVVhKSVRWQkxWakpVVlZSSldrd3lORUV4T1RWbE5IZGlhSFpQVm5sSlVuRlBPVlp1VW1WNlVYUlVjbVZMU0ROaVN6RlFYM0JWWlVFNFkxRXdhSEZvUVhKMFdYaHRSMlJyZEdGMVZIbG1OMWhsYVhGT2FXSjVjMFZJTFZsdWVGVkZia0ZtUjFsa2JESk1MV2Q2WW1WRmJ6WXhiV1U1WkcxUmVFUnRReloxZG5OTlZHbEZNMXBMVUZkemMzazNlbTFYU1VkbGJtVXlVMjVMUzNsNmMzWXdaRlZMUzA1TGMwdG5OMGsxZDFSb2RrbFdSVFI2TFZCdlowOVpjRkZWU1ZkMmVGQnhTblE0TFZoNFgyZ3RhbTlJTWtSMWNqUktiMEYxYXkxdlpHcG1PRXhqVG5OeGRHY3VhSHBoTlVkb2VUSmFOMFIzUW01SVNYbEJTMXAzWncuQ3JMWFhqUDZTbERFVHdTU2ozSXZ6bDVsSGdzazVTZHpmby14WlJCQzVITSIsImV4cCI6MTY4Mzc1NzU2NCwiaWF0IjoxNjgzNzU3MjY0fQ.CridMM7bwY0S0xESITD47gmmqnS2IUHv_XXedo4mhEY',
  callbacks: [
    {
      type: CallbackType.DeviceProfileCallback,
      output: [
        {
          name: 'metadata',
          value: true,
        },
        {
          name: 'location',
          value: true,
        },
        {
          name: 'message',
          value: 'my message',
        },
      ],
      input: [
        {
          name: 'IDToken3',
          value: '',
        },
      ],
      _id: 2,
    },
  ],
  stage: 'DeviceProfileLogin',
};
export const deviceProfileComposition: Step = {
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IkRldmljZVByb2ZpbGUiLCJvdGsiOiJsbW1nZGg3bWQxOWowNWQ3bGltMjY2dmNkayIsImF1dGhJbmRleFR5cGUiOiJzZXJ2aWNlIiwicmVhbG0iOiIvYWxwaGEiLCJzZXNzaW9uSWQiOiIqQUFKVFNRQUNNRElBQkhSNWNHVUFDRXBYVkY5QlZWUklBQUpUTVFBQ01ERS4qZXlKMGVYQWlPaUpLVjFRaUxDSmpkSGtpT2lKS1YxUWlMQ0poYkdjaU9pSklVekkxTmlKOS5aWGxLTUdWWVFXbFBhVXBMVmpGUmFVeERTbXhpYlUxcFQybEtRazFVU1RSUk1FcEVURlZvVkUxcVZUSkphWGRwV1ZkNGJrbHFiMmxhUjJ4NVNXNHdMaTVYWTA1aU9ITmxVekIxUmtadFNFTXdXa2RLU0haM0xrSk5lRlZsUVVGclpWVkxiVlY1WWw5VFgyUm1kak5qY1U1d1VXWlVRV0pOU2kxak4xZFpTMUUwYm1GU1MwOHpiMlV5V25kU1JXWlRMVTFDVFhORVRVcGxNMUkzYWxoRE1tWmhRbGhHY3psdVdrRTVZbEp3WDBGeVVWa3lPV2hNUW1oclVURnZXVkIwYjFWdmFXSlNRWEkxZVVJMGRUbHlXbkZIVFVrMWJrVlRPV1poY3pSMFNYVkNWVXBrUVZCd2RFczRNV1pXVFdaU1dWVjVVVVowYW10NmQxRm9NRnAwVVMxTGVYaE5Rakp1Y0ZJNGJVbHNlbVpUVnpKWFpFUm9WMDFCZURWeFpYRkNTRlUyVTJwdlgyMHlkRVpLZG1OT2VVOWxlbVJNTTNFeFZVZFhTR1JpUWtoR1ZXMWpNamRPZUZaeldVeHZRa2x3TkZWVWJrZEZaek5MV0Zoc05qVnFWMjB3Y1dSeFNsQnlkVjloZG01TGJtdzRlVTVOU0ZGUVpreGpPVkF3V2tGZlJVSnBXR2xTVUVZeGFGUmZjRFpEZDNBMk5tZFhSVTlQV1V0R1NUSTBSVGRUVUdnM1NWY3lZV2QzV1ZOaFJXWjFSVWRmTTNFd1EzUkdSMk5xYW1nNVpVaGFVUzF1ZVRWUFJUVm9SVXd6YjNWcFUySTBaa2xwVGxjMFRtZzBaemwzYlVOR1QxbG9ZMlZKYURKdU5rUkpaRWMzVTJOQ2NHdE9hMWh6ZG1salFsTmhXRUUyZFdFeVJuSm1jVVEzY1RCUVpVMTFTa2R3WkVVNWMycG9iRmR0YkV4MVp5MXJXa3czYkhWMGJscDNZVU42YmtzNWFVcG5lV3RWVm1OMVJHWm5XRXBxZFdodGRXWnNkVFZ4U0VWak9GZFplSGd5WmpSek5pMVJOMGhoVkdsRUxVNTJaMFpZWnpaVlFqZGFWMmw0WlRsdFRVNUdaSFEzU1RjMVJXVkxOVzU2UW1sSUxUVlNObEZwV2sxTU5rdGZXalV0VVhOU1NtcFZZeTFhYTFwdFlUSkNVR1ZaVVhaVlpsTjFNMDFKTjJwcE1XUm5RbG95TVdwd2FHUlFVbU15WTNOUlozbzNYMkZNVlhGRlN6WjVObmRmWTJaSE5UaFViSFZoYTBOYVduTm9OV1pUVmtSMWVHRk1UMnRGYkRsUmRIUXlhMk5QZWxoRFpFRkxUV0YxY1hoS1NtVlFZUzFMVEd4QlZtTk1UbUozV0c1R1VHOXBXVGhzYjI1V00wbGtZamxYTkdKQ1QzSTJVa05uUlVKRlJUVkJRemwzU0dNNFdHZG1URXRHVVVkdWJEQlpNVU5rU2t0NVlTMXRiMDVUZERGbWFWYzBaMVpwY1hKelVtbzNVVmR4TjFwRU4zcHlVVGRIUlc5a09UZzBUREZEYVdnek1teHBNMng1T0RsV1VVMXFhbEJaTkVJekxWVkVkR1pPVDBsR1gwd3hUMDVEVFVSRGNtZEtTMWxEY1ZFdGQzWlJTSFI2YVc5M09WcHdNVlJZTWxsQ1FtNW9hRXBFVm5kTk1GbEtNMWhFWVVWVFNFMDVVMnRwTFdFME1HTmtZbVF0UW1ab2VYVnhRV2htVVdkbWF6VnlZVVpDYW1SMGNVbHhVRWcwVlRadmR6bFdSMlZ6VFdKcFJ6WkVVRkZYWmxGS1FsUnJVRWRrYUhGSFlYUmhabEkyZUhoV1Ztb3libFpQUzFSYVFUSnNZUzFDUkU5ZlgydHJhVE5PYUZGcmJFWmZOeTFaYVcxQlkyeEhPSFI1UjFSZmVGTndiRmg2V0c4M1pUZEthR2R6YVhBeGJFOXBkbU5ITW5aMk5tbG5PWFIxWXpONFJVbExWa2c1ZHpWelpVSjJSbEJRWm5GWGNtNHdXVmRrZVhkSVpUUnNkWHBwUTA5UVdGZzRSa2huVEMxU2JWQkZaV0Z6WTIxT2NEWmthRmhaTWtKTlkyTTJlVEJEWTFKSGRXWkNWVGRXVTNFdFgwdE1aV2QxYUdnMmVrcHZTVnBpUVdSWVVsSlpSMmRETWtOWFV6WkljSEZHZVhWc1RYUnBUWGsyVVZkc1IxbElXR2xIUkVWSWVVeENiM051YUhkdFFUWjJSekJVTlhCR1IwMW9NbkJIUlhZeWFqbGlWRXBZTlZoeFowSnNSR0UwUkdaWmFtdEVVa1pYVERGVFNFTkhVRTh5WlhsZlRtUjFNMmMwZUcxNlJqWllaSFJyTTFkMU4ybE9NREpqWmtkMlFrUk1Oa3BJY1U5MmMwdExPVUZvUlZCblZXaGxSVzFXWVMwME9VOXVWVEp3VVd4d1JTMXBlVTlpV2s1bFdEVnhOM3BYUTIxS1pHZEJUVUZQWTBWVlNubFFTalJCY2pGb1pHSnJRVlZyYTFCNFgweDFSRVoxY2tZM2JXUlpWa3RpWjA1RGFXbEthblpaUkY5alJ6VlNZa28xZWpKMWFtbGZWSFZqWVRaSWVGaHJWRzVLWVRkcGMyRlBNRXhyU25nNFduRklRa2xIZG1kRllWcDFNM054TVVKaWVGRk5NVVptUjFvM0xXeHplWEpPYld4NlZYTXRURTFXYUhacVVteHBZVGhZTlhob01tMXVOMEpCWHpka1dsUjFVVzFLVm0xUmJIWmxUM0pTUWpKcWJuQTJPREExT0ZKMFgxQTBlVXBRWWpjMlIySXRZbU13T0V0QmJHazFTbTVXUWsxRlFrbDJRV1JMYUhScGJHUktXRTFQTURrM1VIUm5halZzT0RSMmNIVnhlR001UmxGeE9XUnFVMFpzZDJkamVtY3hjblpSZDFkbGJ6ZFlibU5WWXpKU1RqRnZPR3hGVVhwVmQzaENhVXRIVVRad1VqTjRibGx5TTFScFlVZHlNbDlPTFhoNFdHOVlPR05HWmpsT1dHWmlVM3B1WlVObE5WZGFiVXR0TW1kdlRVeHBjMlp6TlVaamFFWXRORGhJV1VaQ2RWRXlkM0o1VUZWMlJFdEVSR2hCTWtwVGVHTmpVMjlDUkhOeFYxUTFSVU5IVlRaVlZWZERWVmhDY0RsdWRqRnFWM1J1VkhNdGJYUXliakJqUXpsSk5sbFlTRGhMUVd4WmEwUlpTMmx1ZW1WclJ6RnBMVVZpVm1GT04wMHhRa1ppZUY5VFR6QnVha281VGpCeVJIUkdiV1JFU21WV1FrRlZNVGhmY1ZGTFIwdEhURVJNYWtsM1oyMVlaVEZIZGtGSkxUaHJlbTFqVmw5MlpIVjBiRUpmZFZvM2VucGZORUpMYms5MVNGOVFUemQyUnpZMFNrdFhWbGRQWjFoeVduVTFSazR0ZVRsSWIxUm1ZbEpUY0ZSeUxXMU9URzFmVGs0MFFrMW9hRFJOTUY4NFZIZHFTVzlhYVVkcmFYWlhSWFEwUTIxT1N6aGtXSFZRUzJ4bk4yWlNNVmxFVTNvNWRIQm1RMUZ4UkhBNU5YVnJVRWRMWlY5M09WUjFiVFpVYjB4cE1GcE1heTAxWVdST1VtZHRWRUpYUkhwUWVHbE1jalZQTVRkM2NuZE9aVlYxYW5OMllVMVhVbXhKZVRaWlFVZHpSMkpFWTFGUVJ6WkZkMlo1UmpWRVZHUTNhbFZQVjFweWJuZFlja3BHYVhoNVJsaGZMWFUyUmkxWU1XNXhVbFp1Y25wVFJESnJXVXBvTWtaSmFERlRlbTFSTWs4d1ZFVmFRbVpwVEhBd09WQnVTazlRYWt0Mk9HaDNZbGRrY1RWTWRUbGlUemQwVGt4dGFGcFRUMHhuVkVoS1pHOUhWRzFKVW1oeVQzQXlUSEJLZEVwaVFXaHpja1U0ZEVGbU4zWTBkMHAwYUZWRVgySmZhMTlNVTJ4dVQxWk9XR05QTlhKb04wd3lVV3RTTFhCRlEzbzRaakJFZGxSTlZtbHdiMWxYTlZsTVVHUXRNbk5JTlZkWFNVRjFTMDFzYjNablkycFBOblE0TmxSVFJtSlRNRWRtZVhGWlVVMW1PRTR0TTJOVU5UTndhVzlZWkdadlNqbEdkSFEyVTBkTE9YWjNXVTFITTFrM01UVm1ZV052VDE5d2JGQTBiVjlGTTBsa2FrdEthRjh4T1cwNE9WSldUbXREVjB3MFpHVXhUbXh6YjNSVlJGRXhPVmx6YXkxVlNubDBjMFZzVkd3eGNVZHFVak15VVV0dk5VOXNYMmhQZVZWRlZUVTFkRUU1YUhWNk1ERkhhREoxV0dOcFFrbDNWVTFWYzFKSGNIQnpXVmxqTjBwbVExOWpielU0UkVaaFdTMDFSVUZ2YjBselVuUjNTVkZqYnpKV2NFRTFXWEJqTWpWdVZrczNjVmxGTmxwMWNYQk1iRXhpY0RCblZHcEROMVIwVUZWblNHVnRSMFpzYkhWcGRsRnpOWEJpV1ZwWFJWTnpkSGxwTTIxS1RrSnRPRGxNTWs1aU1VNUVOemhRVkVSNVJtZENRMEl0U1U5Sk5qaFhVbGxNYWtWSFIxUlZkWEEzUVdsbmQzRlJNVTV2VWkxT1MwaGpUMHgzTkVKYU5XbEVUSEl5TXpBd05GSmhNMll4VTIxNU1GQllOMWh4UmkxbU0zaFZlalIwVFZBeE5UZEtTRmx0WVVwcFFuYzROVmhMVjBSaGRXaFFMVnBvVFVneFlqWXpWa1UyU25rMldVNXRRMWRYTldZNVRIQmZNMWhGY2xoSVNEWnZWWGt6UTJwbFZIbHVlRlUyVUhacVEwNVpWazgyUzJKbmNEZFhWVFpTY2pSeVJURXdSbWczVVMxaWNrSmFVSGhDWTJSNlNtOXRSVEpDZGpFd1ZIQjJPV1J3TkUxdE5WbDVhVVF6UTBKd2FIcFdaVjh6Y0VWa1MwWlJSVTVvWTA1Wk1HdEVlR1pHT0dodWVucEhlbEJKT1ZkWFREYzRjV3hxYjI4MFNtTnRNRUpRVVhCV1dWbzBTVmhqWmt0WFJsWnNXa3R6TjJGVk5GbGtNa0V6UjJwck5tTk9UR055ZWt0dVVraHdUa2hwTldKc2JqWlBXbWcxTTJOcFJXNTRNVXRSTUhSUFZXZG9ibEpUTjI5dU9FTmtUbFJHWkRkUVIyUTFNV0pGZUhKVVdrZ3lZbmRWTldsd2RIY3dibXhIVUZBNVIxZzRTMk5pVW10eVIwUXlURUZGVVZOdWFtbHRkM1pYVlVkb1lVVlZOMVkxZEc1ck9HZDRTMk5rWTFOcFMySXpaelZhUlRRMVNFVlNMV2h0TlhaU2VWbHRRa1kxVmxSeU1uWkNVbFEwYlc1Nk9WSXdTblJEV2sxcWFrWlNhM1ozV0hZMFFXUkdORFpIYjJOSVlteHpZa1p2VW05VE5UZDFheTFCYzNFNFpHNUNSelUwWjFKaWRESk5Ta2xMVldkRGRFVm9ZbU4yWmkxSFVuY3hWa1kwTmtGUGNGZEJTQzFJTm05UE0weDZRMDlZVVhKSVRWQkxWakpVVlZSSldrd3lORUV4T1RWbE5IZGlhSFpQVm5sSlVuRlBPVlp1VW1WNlVYUlVjbVZMU0ROaVN6RlFYM0JWWlVFNFkxRXdhSEZvUVhKMFdYaHRSMlJyZEdGMVZIbG1OMWhsYVhGT2FXSjVjMFZJTFZsdWVGVkZia0ZtUjFsa2JESk1MV2Q2WW1WRmJ6WXhiV1U1WkcxUmVFUnRReloxZG5OTlZHbEZNMXBMVUZkemMzazNlbTFYU1VkbGJtVXlVMjVMUzNsNmMzWXdaRlZMUzA1TGMwdG5OMGsxZDFSb2RrbFdSVFI2TFZCdlowOVpjRkZWU1ZkMmVGQnhTblE0TFZoNFgyZ3RhbTlJTWtSMWNqUktiMEYxYXkxdlpHcG1PRXhqVG5OeGRHY3VhSHBoTlVkb2VUSmFOMFIzUW01SVNYbEJTMXAzWncuQ3JMWFhqUDZTbERFVHdTU2ozSXZ6bDVsSGdzazVTZHpmby14WlJCQzVITSIsImV4cCI6MTY4Mzc1NzU2NCwiaWF0IjoxNjgzNzU3MjY0fQ.CridMM7bwY0S0xESITD47gmmqnS2IUHv_XXedo4mhEY',
  callbacks: [
    {
      type: CallbackType.NameCallback,
      output: [
        {
          name: 'prompt',
          value: 'User Name',
        },
      ],
      input: [
        {
          name: 'IDToken1',
          value: '',
        },
      ],
      _id: 69,
    },
    {
      type: CallbackType.PasswordCallback,
      output: [
        {
          name: 'prompt',
          value: 'Password',
        },
      ],
      input: [
        {
          name: 'IDToken2',
          value: '',
        },
      ],
      _id: 70,
    },
    {
      type: CallbackType.DeviceProfileCallback,
      output: [
        {
          name: 'metadata',
          value: true,
        },
        {
          name: 'location',
          value: true,
        },
        {
          name: 'message',
          value: 'my message',
        },
      ],
      input: [
        {
          name: 'IDToken3',
          value: '',
        },
      ],
      _id: 2,
    },
  ],
  stage: 'DeviceProfileLogin',
};
export const confirmPasswordStep: Step = {
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IlRFU1RfQ29uZmlybVBhc3N3b3JkIiwib3RrIjoiaThocm1iN2dqOTRkNHRna2Y3Z21wZWN0MTYiLCJhdXRoSW5kZXhUeXBlIjoic2VydmljZSIsInJlYWxtIjoiL2FscGhhIiwic2Vzc2lvbklkIjoiKkFBSlRTUUFDTURJQUJIUjVjR1VBQ0VwWFZGOUJWVlJJQUFKVE1RQUNNREUuKmV5SjBlWEFpT2lKS1YxUWlMQ0pqZEhraU9pSktWMVFpTENKaGJHY2lPaUpJVXpJMU5pSjkuWlhsS01HVllRV2xQYVVwTFZqRlJhVXhEU214aWJVMXBUMmxLUWsxVVNUUlJNRXBFVEZWb1ZFMXFWVEpKYVhkcFdWZDRia2xxYjJsYVIyeDVTVzR3TGk1SmRGTjRjSGsyUlVONlgwWnZUWFZzUTFvdGVHZDNMbTlwTFY4emJsbFhhbUk0VDBSeGJuWlFjRWRhYW10T1RYWm5NamMyYVMxeVZsVkxkSEZPTkV4ME1uRkpkMWxJUlVsUmJHZHFkMVpoTmxCMVVuQklNWEoyYUV0YVZGVnpWbTAzV0daVk9YRkJRazFVY0UxQlNHeHVPSHBmWkhOQ01GWnlNVm8zYUdVelYwdEhNRTEwY210clZYWklVelZoVkRVeGJUQTNhRWN6Y0cxMVlXMXZkVGMwUmxGUFUwMDNaazlvV0ZCR1JtdHJhM2R0TFZZMFZsRnJXVmQwTVc5M1JHcFVOMnBaTlZGVFh6QlhiMlp4YmtRdE1UZHpRV2hTVjBaUkxVMUpNVFJoU25STlIxWlBNMHhCVlc5TlpXbFBZM0puYUVWMU5sSkRPRU5GWjFrdGVVbHNjRVpxV0ZSUlIwYzBPRmxvVERVM1RuTlJWR1ZZVlVGbk5GUkpZemxEUTB3eWRUbHdTWEpPUTBnMFNuVXhaa2hqU0ZsU2R6RnVUbkJwVGpJM00ySkJXSE4wU0hKb1FrdzFVbmhyVTBFNFRIbG1RbEpWWVZCV1NVeExRa1UwZDFWdWVuaE9jVTVGVkUxdlpUUnNNR0Z1ZVhGaFpHVTVTMkpaWmxobmNtOVVaMEpLWmtOV2RHWlBSWHBZV0VGT1prOWZXVm8zTlVkek5rcElVM2hsZEVoSU1tNTRhRVJEY0dKblp6SkVlbTUyT0ZGVWVsOTBNM0ZsZW1OTE9YRkZZVTVVYmxadVFqYzBkbGR6ZWxRMFYwbG5iM2hTUnpSTVNFMURNRzVKYUZCSU5IWmFlSGQyY0ZGWFpsaFRVbGRDY0VGUk5sUjZhalZYT0Y5cmVYTlNaRUo0U0hBMVRuVkRVa05CWmtSeFRVTjRWMVJ4VDJWMmVrTlViak5TTm1sVlkxZG1OV2RTTjBzNU1UbFRUMVZPVUV0eFVISk9jWFEwYVZWNGNWSllMVmRDYkRkM09GZHlNVmh3Ym5kdVYwZGtTRmRSYjBkTmFuZDNMV2d4YTFCQllVeG5UMFZaU2pOTmRVaGhWbVppYTJ4U1RteHhZekk0T0ZWRFgyODJSWEl5T1U1YWExVXdaMmx4YW5wT2JHaE1hbWc0WkZkaVFUbDZaRWhPVmxWUlZ6VkRSVjlwTUd4NFFrVk9VbUl6TWpKdVlsa3hVakowWVcxWFpYSkNZbmhHYUVWV2NFMWpMalZqVWkxMWJFNXlNbEpWWDFWSFVHVkpWazFxVFZFLmhnbll0cTRzWVJWWjZzU3c4cEhfT3FLWFkxT25GN0xUaE9DUnhrLWtUVFEiLCJleHAiOjE2NzQxNzI0ODgsImlhdCI6MTY3NDE3MjE4OH0.2M4EMYwOxms_0UrtqhoE5-DCE4Mfkcuk7ShpuamnYzs',
  callbacks: [
    {
      type: CallbackType.ValidatedCreateUsernameCallback,
      output: [
        {
          name: 'policies',
          value: {
            policyRequirements: [
              'REQUIRED',
              'MIN_LENGTH',
              'VALID_TYPE',
              'VALID_USERNAME',
              'CANNOT_CONTAIN_CHARACTERS',
              'MAX_LENGTH',
            ],
            fallbackPolicies: null,
            name: 'userName',
            policies: [
              { policyRequirements: ['REQUIRED'], policyId: 'required' },
              { policyRequirements: ['REQUIRED'], policyId: 'not-empty' },
              {
                policyRequirements: ['MIN_LENGTH'],
                policyId: 'minimum-length',
                params: { minLength: 1 },
              },
              {
                policyRequirements: ['VALID_TYPE'],
                policyId: 'valid-type',
                params: { types: ['string'] },
              },
              { policyId: 'valid-username', policyRequirements: ['VALID_USERNAME'] },
              {
                policyId: 'cannot-contain-characters',
                params: { forbiddenChars: ['/'] },
                policyRequirements: ['CANNOT_CONTAIN_CHARACTERS'],
              },
              {
                policyId: 'minimum-length',
                params: { minLength: 1 },
                policyRequirements: ['MIN_LENGTH'],
              },
              {
                policyId: 'maximum-length',
                params: { maxLength: 255 },
                policyRequirements: ['MAX_LENGTH'],
              },
            ],
            conditionalPolicies: null,
          },
        },
        { name: 'failedPolicies', value: [] },
        { name: 'validateOnly', value: false },
        { name: 'prompt', value: 'Username' },
      ],
      input: [
        { name: 'IDToken1', value: '' },
        { name: 'IDToken1validateOnly', value: false },
      ],
      _id: 0,
    },
    {
      type: CallbackType.ValidatedCreatePasswordCallback,
      output: [
        { name: 'echoOn', value: false },
        {
          name: 'policies',
          value: {
            policyRequirements: ['VALID_TYPE'],
            fallbackPolicies: null,
            name: 'password',
            policies: [
              {
                policyRequirements: ['VALID_TYPE'],
                policyId: 'valid-type',
                params: { types: ['string'] },
              },
            ],
            conditionalPolicies: null,
          },
        },
        { name: 'failedPolicies', value: [] },
        { name: 'validateOnly', value: false },
        { name: 'prompt', value: 'Password' },
      ],
      input: [
        { name: 'IDToken2', value: '' },
        { name: 'IDToken2validateOnly', value: false },
      ],
      _id: 1,
    },
  ],
  stage:
    '{"ValidatedCreatePasswordCallback":[{"id":"db09cd18-65a7-424a-9c9e-84c528c3e560","confirmPassword":true}]}',
  header: 'Quick Register',
};

export const loginStep: Step = {
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IkxvZ2luIiwib3RrIjoiNmwxb2RmdWFzbjBxMXNrZXBjZTUzZmMyNCIsImF1dGhJbmRleFR5cGUiOiJzZXJ2aWNlIiwicmVhbG0iOiIvYWxwaGEiLCJzZXNzaW9uSWQiOiIqQUFKVFNRQUNNRElBQkhSNWNHVUFDRXBYVkY5QlZWUklBQUpUTVFBQ01ERS4qZXlKMGVYQWlPaUpLVjFRaUxDSmpkSGtpT2lKS1YxUWlMQ0poYkdjaU9pSklVekkxTmlKOS5aWGxLTUdWWVFXbFBhVXBMVmpGUmFVeERTbXhpYlUxcFQybEtRazFVU1RSUk1FcEVURlZvVkUxcVZUSkphWGRwV1ZkNGJrbHFiMmxhUjJ4NVNXNHdMaTVrTVhnMlptVkJNVmhZU0ZnNFR6VlNTMmRTUTFKQkxsQTBVV0p4Um10Tk5tMDRSblpNV1Y5eVZ6UnBZM0IzVlRneGIxUkxUa3c0YUVweE9UZFNOSGhHYzBGRVpIUjVRVlpMVVhab2Vtd3hjRkl6VVdsMGNIaENVV1pPVVhSbmFWODJlUzFmVGxCR1UwMVJkRGhNT0VSMGFVUk1UMkpHYUZsck1XSnNYMUUxU1ROQlRHd3dRbXRGVjI5TWNUaExTR001V21SbVpWTkZRVXBOTjBFMVEzQTBaRzQxVEc5cExTMVFUWGRoWnpaM2FrUkxORWxmVldKWllXbFRTak5FZGxkclQwZFpSVTV6V0hsSWFuY3RjV0o1WlV0emR6RTBZVWR6Ym5CdVVIVnNWbTFXWkZOc01XMUViSFUyTmxsNFZXOUhUMlZ3UVRKU09VSnVVRE5rYjBOWFMyTXpkREJqWXpVMWFqRm5lUzFYYzJabmVGTmlWekZZTlhkcVRtZFBVR1ozWW5SNVRISktjMHRwYzA0eWMyTTJWbFJ1T1RnMFZpMUVWVzVzVjJRMVN6QlZVVXBPY2w5MllVMURUMUZtU1hSM2NFc3lYMnhZWVhCdE9VVjNWRW8zY0VwVmQwVnJabHBKTkRWM1IyVlBVMGRDVlVaWlp5MVVhV05IVEdwT2NrcGZXazlxTkdKZmVXMWphWE5SU0U1WFdGOUtZeTFRZFZJNGIyWm9RbkE1U1RaRGMyWmZVbGcwWHpKUGJteDNVbDk0Y0d4dFUySlVSVlIxWTA5UVNHTnBkSGx1VjFsQ05VaDJObnB4WjFaNmJ5MDRNMkZCUVVzdFQydGpZWHBNWm1NeU1XYzNNbW94ZWxCU05HWnBhbUZaYVhGRFZGOUVhWE5IT0c0eVV6RkZUazF5T1ZOV2N6QmFjSE5WYkRKWlYzUkplSGhqT0MxMmMxQTBiaTEzWnpsUk5XcExkbkozWlV0c2EyOU9WazVETm5wT1dDMUNhbll6WVV0dFVUTjRVbVJxYUc5eU4zQnJSSFI2TUZKU1RHcHJXaTFYWkdwb05UaFliVFJtYTFKVFJFOTJWMHBLUlZJNVFUUmtXbEZHZEU1elQxcHBTR3BWWjFOdFgzVnpNSE4xZFVwR09EZE5hQzA0WldGd1YybDFMWGgzZFZaeGNuVk5SV0pQVmpGR1J6ZFJUbmRNU1RBdGJWWmlja3gyZVVsS04wNUJiamhxVEZZdFlsZHFMVVp1Wm1vd0xqWlBjemhUU2taUFNUaDRPVzgyTkV4NVdrNXVMVkUuRGpTUGdQck5VdFQ0U2JKWm9fZ2NiUlZCbWVQcGRHcUZzb1UyM250dVNCdyIsImV4cCI6MTY1NDIxNDQxMywiaWF0IjoxNjU0MjE0MTEzfQ.ZGwMWJb5crNXiAvvfvnwciOTyXaAKHjSk-aExg7QdnQ',
  callbacks: [
    {
      type: CallbackType.NameCallback,
      output: [{ name: 'prompt', value: 'User Name' }],
      input: [{ name: 'IDToken1', value: '' }],
      _id: 0,
    },
    {
      type: CallbackType.PasswordCallback,
      output: [{ name: 'prompt', value: 'Password' }],
      input: [{ name: 'IDToken2', value: '' }],
      _id: 1,
    },
  ],
  stage: '',
  header: 'Sign In',
  description:
    'New here? <a href="#/service/Registration">Create an account</a><br><a href="#/service/ForgottenUsername">Forgot username?</a><a href="#/service/ResetPassword"> Forgot password?</a>',
};

export const usernameDisplay: Step = {
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IkxvZ2luIiwib3RrIjoiNmwxb2RmdWFzbjBxMXNrZXBjZTUzZmMyNCIsImF1dGhJbmRleFR5cGUiOiJzZXJ2aWNlIiwicmVhbG0iOiIvYWxwaGEiLCJzZXNzaW9uSWQiOiIqQUFKVFNRQUNNRElBQkhSNWNHVUFDRXBYVkY5QlZWUklBQUpUTVFBQ01ERS4qZXlKMGVYQWlPaUpLVjFRaUxDSmpkSGtpT2lKS1YxUWlMQ0poYkdjaU9pSklVekkxTmlKOS5aWGxLTUdWWVFXbFBhVXBMVmpGUmFVeERTbXhpYlUxcFQybEtRazFVU1RSUk1FcEVURlZvVkUxcVZUSkphWGRwV1ZkNGJrbHFiMmxhUjJ4NVNXNHdMaTVrTVhnMlptVkJNVmhZU0ZnNFR6VlNTMmRTUTFKQkxsQTBVV0p4Um10Tk5tMDRSblpNV1Y5eVZ6UnBZM0IzVlRneGIxUkxUa3c0YUVweE9UZFNOSGhHYzBGRVpIUjVRVlpMVVhab2Vtd3hjRkl6VVdsMGNIaENVV1pPVVhSbmFWODJlUzFmVGxCR1UwMVJkRGhNT0VSMGFVUk1UMkpHYUZsck1XSnNYMUUxU1ROQlRHd3dRbXRGVjI5TWNUaExTR001V21SbVpWTkZRVXBOTjBFMVEzQTBaRzQxVEc5cExTMVFUWGRoWnpaM2FrUkxORWxmVldKWllXbFRTak5FZGxkclQwZFpSVTV6V0hsSWFuY3RjV0o1WlV0emR6RTBZVWR6Ym5CdVVIVnNWbTFXWkZOc01XMUViSFUyTmxsNFZXOUhUMlZ3UVRKU09VSnVVRE5rYjBOWFMyTXpkREJqWXpVMWFqRm5lUzFYYzJabmVGTmlWekZZTlhkcVRtZFBVR1ozWW5SNVRISktjMHRwYzA0eWMyTTJWbFJ1T1RnMFZpMUVWVzVzVjJRMVN6QlZVVXBPY2w5MllVMURUMUZtU1hSM2NFc3lYMnhZWVhCdE9VVjNWRW8zY0VwVmQwVnJabHBKTkRWM1IyVlBVMGRDVlVaWlp5MVVhV05IVEdwT2NrcGZXazlxTkdKZmVXMWphWE5SU0U1WFdGOUtZeTFRZFZJNGIyWm9RbkE1U1RaRGMyWmZVbGcwWHpKUGJteDNVbDk0Y0d4dFUySlVSVlIxWTA5UVNHTnBkSGx1VjFsQ05VaDJObnB4WjFaNmJ5MDRNMkZCUVVzdFQydGpZWHBNWm1NeU1XYzNNbW94ZWxCU05HWnBhbUZaYVhGRFZGOUVhWE5IT0c0eVV6RkZUazF5T1ZOV2N6QmFjSE5WYkRKWlYzUkplSGhqT0MxMmMxQTBiaTEzWnpsUk5XcExkbkozWlV0c2EyOU9WazVETm5wT1dDMUNhbll6WVV0dFVUTjRVbVJxYUc5eU4zQnJSSFI2TUZKU1RHcHJXaTFYWkdwb05UaFliVFJtYTFKVFJFOTJWMHBLUlZJNVFUUmtXbEZHZEU1elQxcHBTR3BWWjFOdFgzVnpNSE4xZFVwR09EZE5hQzA0WldGd1YybDFMWGgzZFZaeGNuVk5SV0pQVmpGR1J6ZFJUbmRNU1RBdGJWWmlja3gyZVVsS04wNUJiamhxVEZZdFlsZHFMVVp1Wm1vd0xqWlBjemhUU2taUFNUaDRPVzgyTkV4NVdrNXVMVkUuRGpTUGdQck5VdFQ0U2JKWm9fZ2NiUlZCbWVQcGRHcUZzb1UyM250dVNCdyIsImV4cCI6MTY1NDIxNDQxMywiaWF0IjoxNjU0MjE0MTEzfQ.ZGwMWJb5crNXiAvvfvnwciOTyXaAKHjSk-aExg7QdnQ',
  callbacks: [
    {
      type: CallbackType.TextOutputCallback,
      output: [
        {
          name: 'message',
          value: 'jane.doe',
        },
        {
          name: 'messageType',
          value: '0',
        },
      ],
      _id: 4,
    },
  ],
};

export const usernamePasswordStep: Step = {
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IkxvZ2luIiwib3RrIjoiNmwxb2RmdWFzbjBxMXNrZXBjZTUzZmMyNCIsImF1dGhJbmRleFR5cGUiOiJzZXJ2aWNlIiwicmVhbG0iOiIvYWxwaGEiLCJzZXNzaW9uSWQiOiIqQUFKVFNRQUNNRElBQkhSNWNHVUFDRXBYVkY5QlZWUklBQUpUTVFBQ01ERS4qZXlKMGVYQWlPaUpLVjFRaUxDSmpkSGtpT2lKS1YxUWlMQ0poYkdjaU9pSklVekkxTmlKOS5aWGxLTUdWWVFXbFBhVXBMVmpGUmFVeERTbXhpYlUxcFQybEtRazFVU1RSUk1FcEVURlZvVkUxcVZUSkphWGRwV1ZkNGJrbHFiMmxhUjJ4NVNXNHdMaTVrTVhnMlptVkJNVmhZU0ZnNFR6VlNTMmRTUTFKQkxsQTBVV0p4Um10Tk5tMDRSblpNV1Y5eVZ6UnBZM0IzVlRneGIxUkxUa3c0YUVweE9UZFNOSGhHYzBGRVpIUjVRVlpMVVhab2Vtd3hjRkl6VVdsMGNIaENVV1pPVVhSbmFWODJlUzFmVGxCR1UwMVJkRGhNT0VSMGFVUk1UMkpHYUZsck1XSnNYMUUxU1ROQlRHd3dRbXRGVjI5TWNUaExTR001V21SbVpWTkZRVXBOTjBFMVEzQTBaRzQxVEc5cExTMVFUWGRoWnpaM2FrUkxORWxmVldKWllXbFRTak5FZGxkclQwZFpSVTV6V0hsSWFuY3RjV0o1WlV0emR6RTBZVWR6Ym5CdVVIVnNWbTFXWkZOc01XMUViSFUyTmxsNFZXOUhUMlZ3UVRKU09VSnVVRE5rYjBOWFMyTXpkREJqWXpVMWFqRm5lUzFYYzJabmVGTmlWekZZTlhkcVRtZFBVR1ozWW5SNVRISktjMHRwYzA0eWMyTTJWbFJ1T1RnMFZpMUVWVzVzVjJRMVN6QlZVVXBPY2w5MllVMURUMUZtU1hSM2NFc3lYMnhZWVhCdE9VVjNWRW8zY0VwVmQwVnJabHBKTkRWM1IyVlBVMGRDVlVaWlp5MVVhV05IVEdwT2NrcGZXazlxTkdKZmVXMWphWE5SU0U1WFdGOUtZeTFRZFZJNGIyWm9RbkE1U1RaRGMyWmZVbGcwWHpKUGJteDNVbDk0Y0d4dFUySlVSVlIxWTA5UVNHTnBkSGx1VjFsQ05VaDJObnB4WjFaNmJ5MDRNMkZCUVVzdFQydGpZWHBNWm1NeU1XYzNNbW94ZWxCU05HWnBhbUZaYVhGRFZGOUVhWE5IT0c0eVV6RkZUazF5T1ZOV2N6QmFjSE5WYkRKWlYzUkplSGhqT0MxMmMxQTBiaTEzWnpsUk5XcExkbkozWlV0c2EyOU9WazVETm5wT1dDMUNhbll6WVV0dFVUTjRVbVJxYUc5eU4zQnJSSFI2TUZKU1RHcHJXaTFYWkdwb05UaFliVFJtYTFKVFJFOTJWMHBLUlZJNVFUUmtXbEZHZEU1elQxcHBTR3BWWjFOdFgzVnpNSE4xZFVwR09EZE5hQzA0WldGd1YybDFMWGgzZFZaeGNuVk5SV0pQVmpGR1J6ZFJUbmRNU1RBdGJWWmlja3gyZVVsS04wNUJiamhxVEZZdFlsZHFMVVp1Wm1vd0xqWlBjemhUU2taUFNUaDRPVzgyTkV4NVdrNXVMVkUuRGpTUGdQck5VdFQ0U2JKWm9fZ2NiUlZCbWVQcGRHcUZzb1UyM250dVNCdyIsImV4cCI6MTY1NDIxNDQxMywiaWF0IjoxNjU0MjE0MTEzfQ.ZGwMWJb5crNXiAvvfvnwciOTyXaAKHjSk-aExg7QdnQ',
  callbacks: [
    {
      type: CallbackType.NameCallback,
      output: [{ name: 'prompt', value: 'User Name' }],
      input: [{ name: 'IDToken1', value: '' }],
      _id: 0,
    },
    {
      type: CallbackType.PasswordCallback,
      output: [{ name: 'prompt', value: 'Password' }],
      input: [{ name: 'IDToken2', value: '' }],
      _id: 1,
    },
  ],
  stage: 'DefaultLogin',
  header: 'Sign In',
  description:
    'New here? <a href="#/service/Registration">Create an account</a><br><a href="#/service/ForgottenUsername">Forgot username?</a><a href="#/service/ResetPassword"> Forgot password?</a>',
};

export const registrationStep: Step = {
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IlJlZ2lzdHJhdGlvbiIsIm90ayI6ImlnOXFqMWNrbjFkYnVjajE2dXBtYmlsYjZtIiwiYXV0aEluZGV4VHlwZSI6InNlcnZpY2UiLCJyZWFsbSI6Ii9hbHBoYSIsInNlc3Npb25JZCI6IipBQUpUU1FBQ01ESUFCSFI1Y0dVQUNFcFhWRjlCVlZSSUFBSlRNUUFDTURFLipleUowZVhBaU9pSktWMVFpTENKamRIa2lPaUpLVjFRaUxDSmhiR2NpT2lKSVV6STFOaUo5LlpYbEtNR1ZZUVdsUGFVcExWakZSYVV4RFNteGliVTFwVDJsS1FrMVVTVFJSTUVwRVRGVm9WRTFxVlRKSmFYZHBXVmQ0YmtscWIybGFSMng1U1c0d0xpNWpPRlJEUTJWRFkyaG9iR1l5ZVRkZmJDMDFSVXhSTGt3eUxWQlRSSFJzUldkVmIzUkZZV3RrZWpNMGQwSXlNekJDTTFGbVNGbGhhV2xZZGpFelV6RmxVWEl0UkcwNVRWY3dTR2htU3pKWk5WcGlPVlo2Yld0b2NFSjRiVGx5UXpFMVUyTmZaRTFSTm1oUk1rMTFOSFpsVm0xTlJUUTNTV3R1Y0djeU1sbE9lVUZRUzJKaGVucGpSMnRMVmxoVmJuWmpjVkpCU25KbGVGQkNRWGxLTURWZlNFdHdNMUIyWTBkaVlVOTRZMVJxVDFCWFQyRTRTbTF6UkRCbGFITk1XV1p3YzFOalIwMVdaVEZyYUU4dFJUZDZPR1YyVGxaVmNqUjNNRTgyVHpoS05GSTRkMHhwU3pseWJsTkpkVlpOZUU5RFFVbDZOVjh5UlhrdE5qazNabVUyTmtKek9UTm5ka3hUU1ZsWVYyVkZkVlF0Um1GRFJ6VTFWWGx5UWxSRGNUZzFTRE14TlZCSU5HMUVTRXhqU25GTWVIbElYM0pIV1RkcFpXRnhORUowV2xVM2RIbHJaVWhZYTBwUU5GVXhTRVJXUWs1M2MwMVhRME5QVUcxSVNGcHpRUzB0WkdkU1Jtb3pabkF3ZEZoWlgxSjRlR3hpUkdONU9WZHlZMG81VkROVWRrRlhSM2N3TTJoUlJISmZTMXBxY1d4bE1YRk5hWFp3TWpoemNHTnRURU5zWmtkYVZVdDZSRlIwTW5wamVqVlZkMVpEYnpsSU4zSmFhRVprZDJkM1lqQm5Ta2xsYTFKTWNXY3pRa3MzUzFCaFYwTnpNbTkxWVdrNExWUlBkM1J6VW14eGR6VTFRMjE0TVZGbFgzVnROVTFyY0dGUU9FSkJNRFUzTUVGNVpYQjNaVTFzVkRsd2FHTlJVSGhTY0Y5NU1FeHNRMkZIUWtOYWNqUmFYMVpqWlhGelIwMUlNbGR1YUdob1VXOTRhM2hNWkRkcFFWcEJNMjFqVlhWMFRtTnhRVlpOZFVwTFdsbHZPVkUxYm5oSk5IWnhWMEpKWkZWNk9IaFljR3BOVGpoR2EwSjVOVmMyY0V4M1lWQkVRaTF5V0dJNVlXeHljQzB0WWt0a2REVjZjRWxXWnpFelRFTjBhV1YzY1haSldFeFFZVEk1V2t0T2FVRjVTblJYWHpkV1gzTjRhbkpXWWxKMk5tMXdUM1ZRYW05dk4xWmZRbWRTWDFCaFZFbFBhR1ZxU0VwbVdtWlVPVjl3ZWw5T1kybFJTbFpFY0ZGTlRrMW9NRnBPZHpKT1dHdEVZMDh4VWtwb1pHNTFaRmRsVGxCc1psWk1NRGhHWm5CYWJFWlFZa3g1YVhsTU5USkZlVjl1ZVV0clIySnRTekEwWTFSaUxXRjNMVko0TVhCb2JqZEROMWhwYzA4elJWOVhYMmN1TTFZeldHNUNNbUZtZEV4NWRWUlVNME5aYldvemR3LmRKWUJVTk5Hb3h6WmZDNDZpQmp2c2VPcVNYVmJLcmNhcC11eko2cGl2ZmMiLCJleHAiOjE2NTQyMTM4ODgsImlhdCI6MTY1NDIxMzU4OH0.2TyyM5dBQYMfuOX24kIzwSy5GSGT8glabII8QN7Gl7A',
  callbacks: [
    {
      type: CallbackType.ValidatedCreateUsernameCallback,
      output: [
        {
          name: 'policies',
          value: {
            policyRequirements: [
              'REQUIRED',
              'MIN_LENGTH',
              'VALID_TYPE',
              'VALID_USERNAME',
              'CANNOT_CONTAIN_CHARACTERS',
              'MAX_LENGTH',
            ],
            fallbackPolicies: null,
            name: 'userName',
            policies: [
              { policyRequirements: ['REQUIRED'], policyId: 'required' },
              { policyRequirements: ['REQUIRED'], policyId: 'not-empty' },
              {
                policyRequirements: ['MIN_LENGTH'],
                policyId: 'minimum-length',
                params: { minLength: 1 },
              },
              {
                policyRequirements: ['VALID_TYPE'],
                policyId: 'valid-type',
                params: { types: ['string'] },
              },
              { policyId: 'valid-username', policyRequirements: ['VALID_USERNAME'] },
              {
                policyId: 'cannot-contain-characters',
                params: { forbiddenChars: ['/'] },
                policyRequirements: ['CANNOT_CONTAIN_CHARACTERS'],
              },
              {
                policyId: 'minimum-length',
                params: { minLength: 1 },
                policyRequirements: ['MIN_LENGTH'],
              },
              {
                policyId: 'maximum-length',
                params: { maxLength: 255 },
                policyRequirements: ['MAX_LENGTH'],
              },
            ],
            conditionalPolicies: null,
          },
        },
        { name: 'failedPolicies', value: [] },
        { name: 'validateOnly', value: false },
        { name: 'prompt', value: 'Username' },
      ],
      input: [
        { name: 'IDToken1', value: '' },
        { name: 'IDToken1validateOnly', value: false },
      ],
      _id: 0,
    },
    {
      type: CallbackType.StringAttributeInputCallback,
      output: [
        { name: 'name', value: 'givenName' },
        { name: 'prompt', value: 'First Name' },
        { name: 'required', value: true },
        {
          name: 'policies',
          value: {
            policyRequirements: ['REQUIRED', 'VALID_TYPE'],
            fallbackPolicies: null,
            name: 'givenName',
            policies: [
              { policyRequirements: ['REQUIRED'], policyId: 'required' },
              {
                policyRequirements: ['VALID_TYPE'],
                policyId: 'valid-type',
                params: { types: ['string'] },
              },
            ],
            conditionalPolicies: null,
          },
        },
        { name: 'failedPolicies', value: [] },
        { name: 'validateOnly', value: false },
        { name: 'value', value: '' },
      ],
      input: [
        { name: 'IDToken2', value: '' },
        { name: 'IDToken2validateOnly', value: false },
      ],
      _id: 1,
    },
    {
      type: CallbackType.StringAttributeInputCallback,
      output: [
        { name: 'name', value: 'sn' },
        { name: 'prompt', value: 'Last Name' },
        { name: 'required', value: true },
        {
          name: 'policies',
          value: {
            policyRequirements: ['REQUIRED', 'VALID_TYPE'],
            fallbackPolicies: null,
            name: 'sn',
            policies: [
              { policyRequirements: ['REQUIRED'], policyId: 'required' },
              {
                policyRequirements: ['VALID_TYPE'],
                policyId: 'valid-type',
                params: { types: ['string'] },
              },
            ],
            conditionalPolicies: null,
          },
        },
        { name: 'failedPolicies', value: [] },
        { name: 'validateOnly', value: false },
        { name: 'value', value: '' },
      ],
      input: [
        { name: 'IDToken3', value: '' },
        { name: 'IDToken3validateOnly', value: false },
      ],
      _id: 2,
    },
    {
      type: CallbackType.StringAttributeInputCallback,
      output: [
        { name: 'name', value: 'mail' },
        { name: 'prompt', value: 'Email Address' },
        { name: 'required', value: true },
        {
          name: 'policies',
          value: {
            policyRequirements: ['REQUIRED', 'VALID_TYPE', 'VALID_EMAIL_ADDRESS_FORMAT'],
            fallbackPolicies: null,
            name: 'mail',
            policies: [
              { policyRequirements: ['REQUIRED'], policyId: 'required' },
              {
                policyRequirements: ['VALID_TYPE'],
                policyId: 'valid-type',
                params: { types: ['string'] },
              },
              {
                policyId: 'valid-email-address-format',
                policyRequirements: ['VALID_EMAIL_ADDRESS_FORMAT'],
              },
            ],
            conditionalPolicies: null,
          },
        },
        { name: 'failedPolicies', value: [] },
        { name: 'validateOnly', value: false },
        { name: 'value', value: '' },
      ],
      input: [
        { name: 'IDToken4', value: '' },
        { name: 'IDToken4validateOnly', value: false },
      ],
      _id: 3,
    },
    {
      type: CallbackType.BooleanAttributeInputCallback,
      output: [
        { name: 'name', value: 'preferences/marketing' },
        { name: 'prompt', value: 'Send me special offers and services' },
        { name: 'required', value: true },
        { name: 'policies', value: {} },
        { name: 'failedPolicies', value: [] },
        { name: 'validateOnly', value: false },
        { name: 'value', value: false },
      ],
      input: [
        { name: 'IDToken5', value: false },
        { name: 'IDToken5validateOnly', value: false },
      ],
      _id: 4,
    },
    {
      type: CallbackType.ChoiceCallback,
      output: [
        {
          name: 'prompt',
          value: 'Choose one',
        },
        {
          name: 'choices',
          value: ['Choice A', 'Choice B', 'Choice C'],
        },
        {
          name: 'defaultChoice',
          value: 2,
        },
      ],
      input: [
        {
          name: 'IDToken1',
          value: 0,
        },
      ],
    },
    {
      type: CallbackType.ValidatedCreatePasswordCallback,
      output: [
        { name: 'echoOn', value: false },
        {
          name: 'policies',
          value: {
            policyRequirements: [
              'VALID_TYPE',
              'MIN_LENGTH',
              'AT_LEAST_X_CAPITAL_LETTERS',
              'AT_LEAST_X_NUMBERS',
              'CANNOT_CONTAIN_OTHERS',
            ],
            fallbackPolicies: null,
            name: 'password',
            policies: [
              {
                policyRequirements: ['VALID_TYPE'],
                policyId: 'valid-type',
                params: {
                  types: ['string'],
                },
              },
              {
                policyId: 'minimum-length',
                params: {
                  minLength: 8,
                },
                policyRequirements: ['MIN_LENGTH'],
              },
              {
                policyId: 'at-least-X-capitals',
                params: {
                  numCaps: 1,
                },
                policyRequirements: ['AT_LEAST_X_CAPITAL_LETTERS'],
              },
              {
                policyId: 'at-least-X-numbers',
                params: {
                  numNums: 1,
                },
                policyRequirements: ['AT_LEAST_X_NUMBERS'],
              },
              {
                policyId: 'cannot-contain-others',
                params: {
                  disallowedFields: ['userName', 'givenName', 'sn'],
                },
                policyRequirements: ['CANNOT_CONTAIN_OTHERS'],
              },
            ],
            conditionalPolicies: null,
          },
        },
        { name: 'failedPolicies', value: [] },
        { name: 'validateOnly', value: false },
        { name: 'prompt', value: 'Password' },
      ],
      input: [
        { name: 'IDToken7', value: '' },
        { name: 'IDToken7validateOnly', value: false },
      ],
      _id: 6,
    },
    {
      type: CallbackType.KbaCreateCallback,
      output: [
        { name: 'prompt', value: 'Select a security question' },
        { name: 'predefinedQuestions', value: ["What's your favorite color?"] },
        {
          name: 'allowUserDefinedQuestions',
          value: true,
        },
      ],
      input: [
        { name: 'IDToken8question', value: '' },
        { name: 'IDToken8answer', value: '' },
      ],
      _id: 7,
    },
    {
      type: CallbackType.TermsAndConditionsCallback,
      output: [
        { name: 'version', value: '0.0' },
        {
          name: 'terms',
          value:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        },
        { name: 'createDate', value: '2019-10-28T04:20:11.320Z' },
      ],
      input: [{ name: 'IDToken9', value: false }],
      _id: 8,
    },
  ],
  stage: 'DefaultRegistration',
};

export const registrationStepWithTwoKBAs: Step = {
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IlJlZ2lzdHJhdGlvbiIsIm90ayI6ImlnOXFqMWNrbjFkYnVjajE2dXBtYmlsYjZtIiwiYXV0aEluZGV4VHlwZSI6InNlcnZpY2UiLCJyZWFsbSI6Ii9hbHBoYSIsInNlc3Npb25JZCI6IipBQUpUU1FBQ01ESUFCSFI1Y0dVQUNFcFhWRjlCVlZSSUFBSlRNUUFDTURFLipleUowZVhBaU9pSktWMVFpTENKamRIa2lPaUpLVjFRaUxDSmhiR2NpT2lKSVV6STFOaUo5LlpYbEtNR1ZZUVdsUGFVcExWakZSYVV4RFNteGliVTFwVDJsS1FrMVVTVFJSTUVwRVRGVm9WRTFxVlRKSmFYZHBXVmQ0YmtscWIybGFSMng1U1c0d0xpNWpPRlJEUTJWRFkyaG9iR1l5ZVRkZmJDMDFSVXhSTGt3eUxWQlRSSFJzUldkVmIzUkZZV3RrZWpNMGQwSXlNekJDTTFGbVNGbGhhV2xZZGpFelV6RmxVWEl0UkcwNVRWY3dTR2htU3pKWk5WcGlPVlo2Yld0b2NFSjRiVGx5UXpFMVUyTmZaRTFSTm1oUk1rMTFOSFpsVm0xTlJUUTNTV3R1Y0djeU1sbE9lVUZRUzJKaGVucGpSMnRMVmxoVmJuWmpjVkpCU25KbGVGQkNRWGxLTURWZlNFdHdNMUIyWTBkaVlVOTRZMVJxVDFCWFQyRTRTbTF6UkRCbGFITk1XV1p3YzFOalIwMVdaVEZyYUU4dFJUZDZPR1YyVGxaVmNqUjNNRTgyVHpoS05GSTRkMHhwU3pseWJsTkpkVlpOZUU5RFFVbDZOVjh5UlhrdE5qazNabVUyTmtKek9UTm5ka3hUU1ZsWVYyVkZkVlF0Um1GRFJ6VTFWWGx5UWxSRGNUZzFTRE14TlZCSU5HMUVTRXhqU25GTWVIbElYM0pIV1RkcFpXRnhORUowV2xVM2RIbHJaVWhZYTBwUU5GVXhTRVJXUWs1M2MwMVhRME5QVUcxSVNGcHpRUzB0WkdkU1Jtb3pabkF3ZEZoWlgxSjRlR3hpUkdONU9WZHlZMG81VkROVWRrRlhSM2N3TTJoUlJISmZTMXBxY1d4bE1YRk5hWFp3TWpoemNHTnRURU5zWmtkYVZVdDZSRlIwTW5wamVqVlZkMVpEYnpsSU4zSmFhRVprZDJkM1lqQm5Ta2xsYTFKTWNXY3pRa3MzUzFCaFYwTnpNbTkxWVdrNExWUlBkM1J6VW14eGR6VTFRMjE0TVZGbFgzVnROVTFyY0dGUU9FSkJNRFUzTUVGNVpYQjNaVTFzVkRsd2FHTlJVSGhTY0Y5NU1FeHNRMkZIUWtOYWNqUmFYMVpqWlhGelIwMUlNbGR1YUdob1VXOTRhM2hNWkRkcFFWcEJNMjFqVlhWMFRtTnhRVlpOZFVwTFdsbHZPVkUxYm5oSk5IWnhWMEpKWkZWNk9IaFljR3BOVGpoR2EwSjVOVmMyY0V4M1lWQkVRaTF5V0dJNVlXeHljQzB0WWt0a2REVjZjRWxXWnpFelRFTjBhV1YzY1haSldFeFFZVEk1V2t0T2FVRjVTblJYWHpkV1gzTjRhbkpXWWxKMk5tMXdUM1ZRYW05dk4xWmZRbWRTWDFCaFZFbFBhR1ZxU0VwbVdtWlVPVjl3ZWw5T1kybFJTbFpFY0ZGTlRrMW9NRnBPZHpKT1dHdEVZMDh4VWtwb1pHNTFaRmRsVGxCc1psWk1NRGhHWm5CYWJFWlFZa3g1YVhsTU5USkZlVjl1ZVV0clIySnRTekEwWTFSaUxXRjNMVko0TVhCb2JqZEROMWhwYzA4elJWOVhYMmN1TTFZeldHNUNNbUZtZEV4NWRWUlVNME5aYldvemR3LmRKWUJVTk5Hb3h6WmZDNDZpQmp2c2VPcVNYVmJLcmNhcC11eko2cGl2ZmMiLCJleHAiOjE2NTQyMTM4ODgsImlhdCI6MTY1NDIxMzU4OH0.2TyyM5dBQYMfuOX24kIzwSy5GSGT8glabII8QN7Gl7A',
  callbacks: [
    {
      type: CallbackType.ValidatedCreateUsernameCallback,
      output: [
        {
          name: 'policies',
          value: {
            policyRequirements: [
              'REQUIRED',
              'MIN_LENGTH',
              'VALID_TYPE',
              'VALID_USERNAME',
              'CANNOT_CONTAIN_CHARACTERS',
              'MAX_LENGTH',
            ],
            fallbackPolicies: null,
            name: 'userName',
            policies: [
              { policyRequirements: ['REQUIRED'], policyId: 'required' },
              { policyRequirements: ['REQUIRED'], policyId: 'not-empty' },
              {
                policyRequirements: ['MIN_LENGTH'],
                policyId: 'minimum-length',
                params: { minLength: 1 },
              },
              {
                policyRequirements: ['VALID_TYPE'],
                policyId: 'valid-type',
                params: { types: ['string'] },
              },
              { policyId: 'valid-username', policyRequirements: ['VALID_USERNAME'] },
              {
                policyId: 'cannot-contain-characters',
                params: { forbiddenChars: ['/'] },
                policyRequirements: ['CANNOT_CONTAIN_CHARACTERS'],
              },
              {
                policyId: 'minimum-length',
                params: { minLength: 1 },
                policyRequirements: ['MIN_LENGTH'],
              },
              {
                policyId: 'maximum-length',
                params: { maxLength: 255 },
                policyRequirements: ['MAX_LENGTH'],
              },
            ],
            conditionalPolicies: null,
          },
        },
        { name: 'failedPolicies', value: [] },
        { name: 'validateOnly', value: false },
        { name: 'prompt', value: 'Username' },
      ],
      input: [
        { name: 'IDToken1', value: '' },
        { name: 'IDToken1validateOnly', value: false },
      ],
      _id: 0,
    },
    {
      type: CallbackType.StringAttributeInputCallback,
      output: [
        { name: 'name', value: 'mail' },
        { name: 'prompt', value: 'Email Address' },
        { name: 'required', value: true },
        {
          name: 'policies',
          value: {
            policyRequirements: ['REQUIRED', 'VALID_TYPE', 'VALID_EMAIL_ADDRESS_FORMAT'],
            fallbackPolicies: null,
            name: 'mail',
            policies: [
              { policyRequirements: ['REQUIRED'], policyId: 'required' },
              {
                policyRequirements: ['VALID_TYPE'],
                policyId: 'valid-type',
                params: { types: ['string'] },
              },
              {
                policyId: 'valid-email-address-format',
                policyRequirements: ['VALID_EMAIL_ADDRESS_FORMAT'],
              },
            ],
            conditionalPolicies: null,
          },
        },
        { name: 'failedPolicies', value: [] },
        { name: 'validateOnly', value: false },
        { name: 'value', value: '' },
      ],
      input: [
        { name: 'IDToken4', value: '' },
        { name: 'IDToken4validateOnly', value: false },
      ],
      _id: 3,
    },
    {
      type: CallbackType.BooleanAttributeInputCallback,
      output: [
        { name: 'name', value: 'preferences/marketing' },
        { name: 'prompt', value: 'Send me special offers and services' },
        { name: 'required', value: true },
        { name: 'policies', value: {} },
        { name: 'failedPolicies', value: [] },
        { name: 'validateOnly', value: false },
        { name: 'value', value: false },
      ],
      input: [
        { name: 'IDToken5', value: false },
        { name: 'IDToken5validateOnly', value: false },
      ],
      _id: 4,
    },
    {
      type: CallbackType.ChoiceCallback,
      output: [
        {
          name: 'prompt',
          value: 'Choose one',
        },
        {
          name: 'choices',
          value: ['Choice A', 'Choice B', 'Choice C'],
        },
        {
          name: 'defaultChoice',
          value: 2,
        },
      ],
      input: [
        {
          name: 'IDToken1',
          value: 0,
        },
      ],
    },
    {
      type: CallbackType.ValidatedCreatePasswordCallback,
      output: [
        { name: 'echoOn', value: false },
        {
          name: 'policies',
          value: {
            policyRequirements: [
              'VALID_TYPE',
              'MIN_LENGTH',
              'AT_LEAST_X_CAPITAL_LETTERS',
              'AT_LEAST_X_NUMBERS',
              'CANNOT_CONTAIN_OTHERS',
            ],
            fallbackPolicies: null,
            name: 'password',
            policies: [
              {
                policyRequirements: ['VALID_TYPE'],
                policyId: 'valid-type',
                params: {
                  types: ['string'],
                },
              },
              {
                policyId: 'minimum-length',
                params: {
                  minLength: 8,
                },
                policyRequirements: ['MIN_LENGTH'],
              },
              {
                policyId: 'at-least-X-capitals',
                params: {
                  numCaps: 1,
                },
                policyRequirements: ['AT_LEAST_X_CAPITAL_LETTERS'],
              },
              {
                policyId: 'at-least-X-numbers',
                params: {
                  numNums: 1,
                },
                policyRequirements: ['AT_LEAST_X_NUMBERS'],
              },
              {
                policyId: 'cannot-contain-others',
                params: {
                  disallowedFields: ['userName', 'givenName', 'sn'],
                },
                policyRequirements: ['CANNOT_CONTAIN_OTHERS'],
              },
            ],
            conditionalPolicies: null,
          },
        },
        { name: 'failedPolicies', value: [] },
        { name: 'validateOnly', value: false },
        { name: 'prompt', value: 'Password' },
      ],
      input: [
        { name: 'IDToken7', value: '' },
        { name: 'IDToken7validateOnly', value: false },
      ],
      _id: 6,
    },
    {
      type: CallbackType.KbaCreateCallback,
      output: [
        { name: 'prompt', value: 'Select a security question' },
        {
          name: 'predefinedQuestions',
          value: ["What's your favorite color?", 'Where did you grow up?'],
        },
        {
          name: 'allowUserDefinedQuestions',
          value: true,
        },
      ],
      input: [
        { name: 'IDToken8question', value: '' },
        { name: 'IDToken8answer', value: '' },
      ],
      _id: 7,
    },
    {
      type: CallbackType.KbaCreateCallback,
      output: [
        {
          name: 'prompt',
          value: 'Select second question',
        },
        {
          name: 'predefinedQuestions',
          value: ["What's your favorite color?", 'Where did you grow up?'],
        },
        {
          name: 'allowUserDefinedQuestions',
          value: true,
        },
      ],
      input: [
        {
          name: 'IDToken9question',
          value: '',
        },
        {
          name: 'IDToken9answer',
          value: '',
        },
      ],
      _id: 8,
    },
    {
      type: CallbackType.TermsAndConditionsCallback,
      output: [
        { name: 'version', value: '0.0' },
        {
          name: 'terms',
          value:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        },
        { name: 'createDate', value: '2019-10-28T04:20:11.320Z' },
      ],
      input: [{ name: 'IDToken9', value: false }],
      _id: 8,
    },
  ],
  stage: 'DefaultRegistration',
};

export const successMessagesRenderingStep = {
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IlRleHRPdXRwdXRDYWxsYmFja19MVyIsIm90ayI6ImRsdGJnMGZrZGZpY2RucXUwZzgzaDh0MHRrIiwiYXV0aEluZGV4VHlwZSI6InNlcnZpY2UiLCJyZWFsbSI6Ii9hbHBoYSIsInNlc3Npb25JZCI6IipBQUpUU1FBQ01ESUFCSFI1Y0dVQUNFcFhWRjlCVlZSSUFBSlRNUUFDTURFLipleUowZVhBaU9pSktWMVFpTENKamRIa2lPaUpLVjFRaUxDSmhiR2NpT2lKSVV6STFOaUo5LlpYbEtNR1ZZUVdsUGFVcExWakZSYVV4RFNteGliVTFwVDJsS1FrMVVTVFJSTUVwRVRGVm9WRTFxVlRKSmFYZHBXVmQ0YmtscWIybGFSMng1U1c0d0xpNVVTMUV3WDBzd1MxbEVWVTR0VldwYWFqSTBiSEZCTGtSTE1VRlNWakJyY0ZOdU5rSldablp1YVhaSGNtbEpia3M1V0RCS1dWaERNRWxFZVVGeU5VOXdVWGg2T0VkNFExaEViV0UyVnpCNU5qaGxOMmgyV0RGTVpHUXdaRjkwYUd0dWVYcFFhRk0yUmw5WlFXdzBVR2h1TjFkZlEybGthRVpGUmxkdlZXbzNNbVE0VW1nNE4wOU9ZMDlITjFaUFVHdDJhbmxQVkRKR2VrODViWFIyTlZFMVdVbGxaMGhpWTBKdlVVZFdlR3RpV0ZSekxYa3hTVEJrVmpsMWExZGhVVzFJT0VaU2RYZFlXR0pwVUU4dE5FNDFObUp6ZFhCV05uVndOWEZtVWt0WVQycGtSakJuYzBSSExUQk9iMk5XVHpNd1FXdE1abUY1YmtWVWRYZFJjbXcxVG1rMWRrWmpObE5JWmtwdlIybERWMlJoVFcxeFMySmtZak52YTI1U09VcDNkblZmTWxsWVlsSnVTWGhqZGtSdWIySlVNMWRUVkZsdlpuUnpUMWxxUWkxVWNuWmlURk5GVUhGSE1EVkRPRlZyVWxSclZ6bFJka1U0UlY5MmJsSnRjVFZZVEZWWWVFZFllbEpuV1dabWEzTTJaWHBSU1dSUVMxaFNNRlU0WjFaalJVdEdlbkZOVWtaalYyMVBOelF6YldGUlZHRnpZV3RuZDBSQlVEYzVia0pJUzNKcFNUbHFielZPYjFVeUxWZDJNMDVXY2xKeU1VOTFPWFF0U0hSa1UybGFRV3N6WWw5amRDMHRSSFl6YTNFMmRVRm1NMmhpVVZBeE4yTnhOVTV2TmtobVJUWlhOMTlMZWtodVdFMXVZVTVTUm5OMlMyTjVOSGRXT0VKMFZXUktNM281UldGSlRWWnFSemR5VkdSS1JIWm1USFJYVDBsblVscENVR3hqTldscVdVWkpORGh2WlVWbVJHUTRNMGRwYjBGbWVGcFRTbUZZV1hkV1ZWVTViWE5ZTTJSSFlWUnZZbGhLUVhWdlptZFhUVVJ4Ym5KTFkzZGZjRmRSUVVadVlYaDJUa1ZYZG1wSVlYQkdPSFowUlRoMFpXeGhNWEk0WjJWRE5qbHJTRzFGY0dFeWNXTkZOWEUxVm5Cc2EyVnRNVWhRVTA1T1JWRjVPVFZqYWtWSVdFbHhXRTVQTmtsVlZFRk5SV05ZVlRBNVoyVnNWelpxWjFwTFZUSm5NbTlYWmxGR2VERnRURWRRTFcxcFVYTk9RalJTVGxsd05XNW9iV1Z0YlZwb1ZrdGplR1Z0UzJONGRrZzFSbXBGYTBKNVZWZDBVRlJWYVc4NFFVMXVTalUxWkVkRGFEaGtUbXhCYUdaaGRXZFhTV3AwTFVOdGJDMW9RVkZ4VlVkR01XcDFUalZyWDFSbVNIVTJaRFJDTVRsbVpGVXpTMFZ6V1ZGVldUVndiVVpmTkc5WllYRnJOeTExYjNwSWRHNXpaalZDZWxGYVNFTlVkM3BpT0c5b01DMTNWMVpZZUVWM1VVbEdUSE15VmpCQ05rSlJNMTlHVHpaamJXUm5aa1puWldGV01GOVhRMlp2YTBoRmFuVm1MWFJtZDNsWk9HVnlVRFZMWkZZMWFHWk5NblpMYkVSWmNrbHVaVTk1UTJFMVNIbENSMTlrT0hsS2FXMUZTMmxOU25CRFl6RmxjMFpwZWxwVVZuTk1NMmRaUmpCNlRXYzRla1F6UjFkeVZFcDJkMlUzWkROWVRqYzNVWFJyVWt0dGRHMU1hM0pwUm1WNWNEVkVieTFaVjNSbVVHNXBORE5GY2tKTVRUSjVTVWx2Y3kwdFJWOU1RM1JMVm5SSmMxOXBWbTloV1U1d2RtMXJiV2RVWlRoUVpUZEZRVXhOY0VWUFVXNDFSVkJuUmpjd1JVeHdValU0UmtOak5qaGlVRFJVVURVNWF6UnRWamxpYmtjM2JqYzVOV1JSV1dwUFZHWlVWRVJCUkZSYVVYVkROV05OTjFSemNUZDNURGczVTBGTWRFOTJYMUJETkdRNVkyOXNUbnBWWmpSMFdIcEdhRTFoUTNBMVZITnVXazlQYjJ4U1gzZzVja1JxZEcxeFZFMVpiMUExTWpoeFdYVnhSVkpWYlVOb2REWlFkV3N1VWpsWFowNVNSRWxZVW05UmVFWnBiV1ZsVDFaQ1VRLlpuV2xST01kVEhveFFuYTBWOERkdTFRZVRockhOM0hrOENSaDhtMnN5T3ciLCJleHAiOjE2OTQwMzAzODAsImlhdCI6MTY5NDAzMDA4MH0.cyApCtDHSS0DTUCqqs958ckBJ23DCf7DvsRUgQr0gEM',
  callbacks: [
    {
      type: 'NameCallback',
      output: [
        {
          name: 'prompt',
          value: 'User Name',
        },
      ],
      input: [
        {
          name: 'IDToken1',
          value: '',
        },
      ],
      _id: 2,
    },
    {
      type: 'PasswordCallback',
      output: [
        {
          name: 'prompt',
          value: 'Password',
        },
      ],
      input: [
        {
          name: 'IDToken2',
          value: '',
        },
      ],
      _id: 3,
    },
    {
      type: 'TextOutputCallback',
      output: [
        {
          name: 'message',
          value: 'Hey, you made it...',
        },
        {
          name: 'messageType',
          value: '0',
        },
      ],
      _id: 4,
    },
    {
      type: 'TextOutputCallback',
      output: [
        {
          name: 'message',
          value: 'Hey, you made it...',
        },
        {
          name: 'messageType',
          value: '1',
        },
      ],
      _id: 5,
    },
  ],
};

export const failureMessagesRenderingStep = {
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IlRleHRPdXRwdXRDYWxsYmFja19MVyIsIm90ayI6InU1NDV0dThjMzh2dWNqcWYxM3BrYWtsdmt0IiwiYXV0aEluZGV4VHlwZSI6InNlcnZpY2UiLCJyZWFsbSI6Ii9hbHBoYSIsInNlc3Npb25JZCI6IipBQUpUU1FBQ01ESUFCSFI1Y0dVQUNFcFhWRjlCVlZSSUFBSlRNUUFDTURFLipleUowZVhBaU9pSktWMVFpTENKamRIa2lPaUpLVjFRaUxDSmhiR2NpT2lKSVV6STFOaUo5LlpYbEtNR1ZZUVdsUGFVcExWakZSYVV4RFNteGliVTFwVDJsS1FrMVVTVFJSTUVwRVRGVm9WRTFxVlRKSmFYZHBXVmQ0YmtscWIybGFSMng1U1c0d0xpNURXRzF3V0V0eVJFd3pOblY0WkcwMk5YWlpVblZSTGtKS1ZWRTRZMmxKTkZwaE5VaG5SSFpEVkhadU5GY3dkR0p6V1dGSk9VMVRaRVEyZG1vd2MzbFlkVEJZTkVsTVozYzRkVFo2U1RaM1VubFZhVEEzUTFwUmIxVkNWRk0wUjI1SVpTMUZWMFk0Vm5OMFJFNXhjSFYwVDFWUlQxaE9NRVJ6VnpOWmVFOTBaa1p3Vld4T1RrcERjbTVNZWtvdFpFUlhPRGc1UVVSTWVuUnFUblZ0TVRKVU5VaDBSRmRJZFRkS01UQlliblJuYWtKek5uUlBRVjgxU0RCcVYwUm1iM3B5TVVOYWNuTjBlVWRQVm1SNmRVZHdiakl0TlZad1ZtdFBNRVp1UTNsRFJFOUtNM1J5VUdKYVprVlJiVU10WXpCQmRYUTFiek55Y3pCalFVNURaV1pTUVY4ME5FSnpaV2xUZUd3NU1FbGljM2RhTm1oak9YZzRVbXR6ZHpOYWFHdEpORXg2UzJkMmNHaFZRbFJJVWtWUVZrWnJabXd6WVhSS1dFZDJOVXN4TVhrNVRYUk1VR1ZVVnpGcmJIcFJOUzFVTUZsVlVsUkxNRWx5WDFGTmFWTlpWRlZuUlRoWlZWQTBNM3AxVDBONldIVTBWa1JRT1c0NFZrNW5OV2hpVVhONE5IWlNZMUEyUW05NFZWVmpaa3RaYmpsc1kxbFVVV1Z1UlhsYWNFRmFWVjlaY3kxclJUWmtTakZJY0ZGQ01VTnZPR0pMTnpOd1dtNWxZMU5IVVVwb2VITm5abGszUWxoQlMwUmFja0Z6VFhJME9FdHBUMkZUZVhJd1ZqQkRZbE5mYkRaNGNuUXdSMGxaVlhsRllYRndlWEJCWTBSdVFUbHpORGxNU25WQlExaGFkSE5qYVVwNE5sSkdOeTFCWDBOcFZrSldZMkl0Ymw5bVVVcFhObXRFYVdGNVUwVndVVWt3VW1SVmVrRXdXRkJCT1c1RE5XOTBRV3RqTUU5NVdrMXdOVEJCY1V0dmIyOXJOMlo2TlUxa05TMU1NbXhqVlZaQ1VEVmFZM0ZOV0VGWlltcEtNVkpQTXpSNmJXdGhWa1pJYUZOb1NqUnlUalF0WkdWalJuZHdTRXhMTVZGcWJFOWlibDlRYzJOU09UaEtNMHB3ZUhOT1EwMDBZbkJMZVdoclVpMVJTelpTWmw5NlJWbGplakZpYWpoQ2NqZFliMU0xVFUxSVFraHNTVkpOTFc1SlFVcE9XbkUwUjFwUk5FSlZjbUpFZEhoSFYxVlFTbEpJWmxCMlpWUnlTMjF3Tkd0QlN6UmxTRFZOWlc0MGJVdEZUSGgzTjBGRFRGbzBMVVU0UXpZd1dERjRNbE52UzJsTVUzbzJaVmxIYVZGd2RpMXpiRFI2WTBsNlVWZFJSelo1VG1GSFNXUkhiSE5DWjJGYUxXczNaM1Y1TnpaUVZtMWFNRmN0YUhFeVJHbEJRalEyZDIxYWFrWmZSekk0ZEZOU09FeFhjRkExYTBkeU5VNTRSVjlVWkVaZmNHaEtNWFY0WmtoVmNrdEZPVTlxVkUxQ01IWk9hSFJRVkZJM2JGWlBTSFIxU2tWMVpsb3RSMjUwVFd0Wk9XMUdVMHd3VWpSd2RGWnpSVFowYTBjemQwMUNlVFo0VTNCVFdFRmZPSEZVTFhaVllWVmhRbGN3ZURCeWFXazBkSEI0VlZoWmVuWXhORTAzWnpWdU9YUlBZM2xVUWsxWlZEVnZRbWhhZDBobmRuVkxSMnhsYkVveVVXSnJNVkZZVFhkWFFrVlBkSG8zVERWS2NXWk9hMGRFWDFKSFdsSXRlRmgwY1d0NFltWlpOR2hhTm1OS2NGRlJXRGxFWTBaUk16RldXVTV2YWpjemFuQXhSWGhUV0ZwNldYWnRWMUJoYTNoWmNVMDBPSHBDYjJJemRIVTRhVTgxU0dKUk9VMDBZamQyT0RCVlkyRTFkRXB6VFRGWWNtdDJTVE53Ym1wNVUyaERTV1p1Wm5aQ04zRnVla05CTmtoNloxSmtVblUwTldGVFltRmlhVFZEUlY5c09HZEJTVlY2YjFkalVucG1OekJpUjAxTlJtNXBZVlJWTlRGaGVVVk1NR0pZTFZoSWEwbGFUVkpyVUhVNU9URm1PRFpQYmxwZllXRkNhMXB1Y0RNMFdVSldWVmRTVjNselRFdFhka0pXUVhsR1RIWjFjSHBCWmtaSFNIaFJMalF6VGxSNGMxRmlXSGszZFZRMmFGOU1kbmx0VjJjLnN4MlFyNjV5VWVqdEo0cGc3S0t6NEptV29CTUdmQ0VxeTlEOWVFVnZnbmMiLCJleHAiOjE2OTQwMzE4NzAsImlhdCI6MTY5NDAzMTU3MH0.PicOMBEd5Q48a1E_-UrCUXuGYd70OomOy_xbwIz3oug',
  callbacks: [
    {
      type: 'NameCallback',
      output: [
        {
          name: 'prompt',
          value: 'User Name',
        },
      ],
      input: [
        {
          name: 'IDToken1',
          value: '',
        },
      ],
      _id: 2,
    },
    {
      type: 'PasswordCallback',
      output: [
        {
          name: 'prompt',
          value: 'Password',
        },
      ],
      input: [
        {
          name: 'IDToken2',
          value: '',
        },
      ],
      _id: 3,
    },
    {
      type: 'TextOutputCallback',
      output: [
        {
          name: 'message',
          value: 'You have exceeded login attempts. Please contact support.',
        },
        {
          name: 'messageType',
          value: '2',
        },
      ],
      _id: 4,
    },
  ],
};
