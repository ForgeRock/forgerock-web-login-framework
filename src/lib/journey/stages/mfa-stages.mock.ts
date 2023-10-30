import { type Step, CallbackType } from '@forgerock/javascript-sdk';

export const oathRegistrationStep: Step = {
  "authId": "eyJ0eXAiOiJKciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6ImRlbaEluZGV4VHlwZSI6InNlcnZpY2UiLCJyZWFsbSI6Ii9hbHBoYSIsInNlc3Npb25JZCI6IipBQUpUU1FBQ01ESUFCSFI1Y0dVQUNFcFhWRjlCVlZSSUFBSlRNUUFDTURFLipleUowZVhBaU9pSktWMVFpTENKamRIa2lPaUpLVjFRaUxDSmhiR2NpT2lKSVV6STFOaUo5LlpYbEtNR1ZZUVdsUGFVcExWakZSYVV4RFNteGliVTFwVDJsS1FrMVVTVFJSTUVwRVRGVm9WRTFxVlRKSmFYZHBXVmQ0YmtscWIybGFSMng1U1c0d0xpNXNSMWxPYzA5ek9GSnpUbmgwVG0xcGIwTTRjbkozTGpkclV6QjFjRXh6TFZadExVRmhTSGhLYURocmRVWTJXVFJwYVU0eGIzaExZalZ4Y1VsWGQzb3lTWGhGZERSdk0yMTZVR3BITTBseFZXZ3lUVmRLWTJsQlRXaDBlbWR2UW5CYWIxOUJUMEozWWtoQmFXRkhSRTR4TnpSTFR6bHhUMDlLVVdGT2JXYzNSMEZvVjNOUGVVYzVVbXBzT1UxTVNGTlBhV1JuZEZOdE1rUlVNR1l6Um0xTFkxWXplWHBQUlhabFUyMXNhR1ZtUldwdlVFZG1jV3RQUTNsSU1uTmtURTFIUzJacVMwbEhaV1kxZFVoZlNXUjNUak5tY2kxVGIyUkRjVlpRU2twdU5GWTNiMUp0VTFGRldXWmlWME5MTVdGSVRGQlhRemhWUkU1TWVUTjNkMFZNTkRSTVMzUmFMWGgwVjJGQ04yNUtXbFZ4UTBwMFRXdHRZV0pIYnpKNGJHdzNOWFZuWVhsbk1IVk1NVE42V2tkTVgweEdObmxETTA1UWFWbFRSbnBHZUZka1dsWk9kSFJDWW5aMWMxZHRVakpGY2kweExXdzJZbEp0UmpSc1kyOHdWWEF4T0ZGWFpXWmpPRTlMWW05aFNqQkxkMVp4TmxrMFZqUmtNa3RIVHpZdFlsOXJMV1JqZFRCSGJsOHRiMHBCTjNSaWNrNXlXbVZCTUhSNmVtTkVaR052VFZaTGNuUnhiV1JYYWt0dVUwdHpVbkF3Vm1RdFRHMUlTa1pXVkd4Q1RFZHlPSHBIZERGaWNGTkRUbXBNY0VZNWRESnFaR3hPTkVZNFZsaEVMV3QzYzJGTU1WUkNZalpGUVdZMVYxWnhTVVZJTWt4c2RsaFRWVVp3TVc5dk0zSTRjamRWVTFoTlJsb3llRVprYkdoc1VqUk5UVVE1VjBOTGQwMWxVbFJWT0hWS2VGaDNaMk40VkVGWlZFSkJUVmROUzFSRWFqUmpTWGMxV1V0S2R6ZDJhWEJyYnpGVWVtOUVTamhCVkc5UmQwMDBZV1p1WnpGMWMzQmpORmw1VTBNemJFcEdSME0zVFRCR05tOVNNbVl6ZEVNeU1scHBRamhUYlZCVExWVTVSRU5oTUZOeWRWUjZZa1JrZWpNMlEwSm5iM2RzWlUxU00yeHVObkJQY1UwMldXMW5OV2RDY25BM1VrVklXamxHWTJobVdGRklPVUp1UVRoWlZXUXdVVFo1U1VGak1FWTVTekp1Y0hReVFrOVdVMXBUWDIxUU1rUmlXakZVU1MxelUzSnBNMjl1WVRaa1ZrUlhTSFJZTVMxak9XZFZVRUpRY1d4MFVGOXBSMUJtYVRSTWIwbDNWMWRGU1ZCcE9HNUxYekZXV0RsZmJ6QjBVbVJFZEc5UlRtTndWMFpKUkRKNFZrWXdSSEpKWVVsNE0zZEJNbTQzVjJsR1RFbFlORjh0VEROMmJrSnJkMDEwZUZkcFYydElMV3BDY25wcVdXWkVWMGxVWVVwbFlqSjJkVXROVjFKWVNIWklOWEIzWkVkd1prOU1NMkpXWm1wMVZsRjBWVzA0WlU1WWNHRTNNV3B1YTBoaU5sSm5PRXQwUzNWMVpIUnVjMmhGZEU0eVdXMVRNbVEwUjJwcVRrOVZUMUZFU0RaZk5URnRiVEpRZVVoMVMzTklXSEJ3VGxaM01VWllTVXd0VmpWMmRsbHdkbmd3T1RkNFJsbDFkVzFXZDFvNFJWWnRSM2htTXpOSFowZHJkVlkyWlZaRlkxRnNaVkF3V0dKbU5EVjRUVmQxYkRrMlVWTk5TR2RYY0hvNVJVUkhVbUZ4WmpobGEyUkxkbWR1V1haMGVVOVJNMHcxYjNCelRXaDFjRkZRUmtscVRFRklha1U1T1Zac1RHRjRURjlPYVd4bVdrVmhhR2MxZW5obFRXSm1UMVJpZEZCRmVrVlhRWGc1TmtOcmIzVkVNVVptTVY5d2JVMW1WM0pXWlRaeU5VRTFaRlpFYjFReVlWTkJWRjl4YkdWSlgyUTBaMjVpVVhwclVIRlFNelZ6WjFadlFYa3lWVTF6Y1daVGQxYzFkazVWZERjM1JUbHFUSFZSZW1OTWNUTTNNVmhKVmpCc2VWZzNhMlpTWWxGelVGUndUV0Z1ZHpGelVXUnVWVWd6WDJ0dGRYcFJURGhqV0hwNVMxQnVPV1JHVkZCdE5XVm5ZblJXVVZoR01VVTJYMGR2TjFkWVIxaFNOMlJ2UjJkRk1uSmxjVGxpYm5GNFdsaDZTbWRpZFZORWRqSnJjVTg1Tmt0UlNsa3hlamQ0TmtkaVNYRXRNRVF4Vm14MFNrWllaeTVOVjBOelRVeDVNamQ0TmpKdFZqQjZZbTlRWXkxUi5wYWtKbExQN01UMmJyZkVKV2ZHNmdETWg5YmVhSzhiUV9IcDFWTVJpcGJNIiwiZXhwIjoxNjkzOTI2MjE2LCJpYXQiOjE2OTM5MjU5MTZ9.4z1ZGuxP8jJZ7WgNbIJq4zpEZrFYMXG6o_7upHJGoes",
    "callbacks": [
        {
            "type": CallbackType.TextOutputCallback,
            "output": [
                {
                    "name": "message",
                    "value": "Scan the QR code image below with the ForgeRock Authenticator app to register your device with your login."
                },
                {
                    "name": "messageType",
                    "value": "0"
                }
            ]
        },
        {
            "type": CallbackType.TextOutputCallback,
            "output": [
                {
                    "name": "message",
                    "value": "window.QRCodeReader.createCode({\n    id: 'callback_0',\n    text: 'otpauth\\x3A\\x2F\\x2Ftotp\\x2FForgeRock\\x3Ajlowery\\x3Fperiod\\x3D30\\x26b\\x3D032b75\\x26digits\\x3D6\\x26secret\\QITSTC234FRIU8DD987DW3VPICFY\\x3D\\x3D\\x3D\\x3D\\x3D\\x3D\\x26issuer\\x3DForgeRock',\n    version: '20',\n    code: 'L'\n});"
                },
                {
                    "name": "messageType",
                    "value": "4"
                }
            ]
        },
        {
            "type": CallbackType.HiddenValueCallback,
            "output": [
                {
                    "name": "value",
                    "value": "otpauth://totp/ForgeRock:jlowery?secret=QITSTC234FRIU8DD987DW3VPICFY======&issuer=ForgeRock&period=30&digits=6&b=032b75"
                },
                {
                    "name": "id",
                    "value": "mfaDeviceRegistration"
                }
            ],
            "input": [
                {
                    "name": "IDToken3",
                    "value": "mfaDeviceRegistration"
                }
            ]
        },
        {
            "type": CallbackType.ConfirmationCallback,
            "output": [
                {
                    "name": "prompt",
                    "value": ""
                },
                {
                    "name": "messageType",
                    "value": 0
                },
                {
                    "name": "options",
                    "value": [
                        "Next"
                    ]
                },
                {
                    "name": "optionType",
                    "value": -1
                },
                {
                    "name": "defaultOption",
                    "value": 0
                }
            ],
            "input": [
                {
                    "name": "IDToken4",
                    "value": 0
                }
            ]
        }
    ],
  stage: 'QRCode',
};
export const oathRegistrationErrorStep: Step = {
  "authId": "eyJ0eXAiOiJKciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6ImRlbaEluZGV4VHlwZSI6InNlcnZpY2UiLCJyZWFsbSI6Ii9hbHBoYSIsInNlc3Npb25JZCI6IipBQUpUU1FBQ01ESUFCSFI1Y0dVQUNFcFhWRjlCVlZSSUFBSlRNUUFDTURFLipleUowZVhBaU9pSktWMVFpTENKamRIa2lPaUpLVjFRaUxDSmhiR2NpT2lKSVV6STFOaUo5LlpYbEtNR1ZZUVdsUGFVcExWakZSYVV4RFNteGliVTFwVDJsS1FrMVVTVFJSTUVwRVRGVm9WRTFxVlRKSmFYZHBXVmQ0YmtscWIybGFSMng1U1c0d0xpNXNSMWxPYzA5ek9GSnpUbmgwVG0xcGIwTTRjbkozTGpkclV6QjFjRXh6TFZadExVRmhTSGhLYURocmRVWTJXVFJwYVU0eGIzaExZalZ4Y1VsWGQzb3lTWGhGZERSdk0yMTZVR3BITTBseFZXZ3lUVmRLWTJsQlRXaDBlbWR2UW5CYWIxOUJUMEozWWtoQmFXRkhSRTR4TnpSTFR6bHhUMDlLVVdGT2JXYzNSMEZvVjNOUGVVYzVVbXBzT1UxTVNGTlBhV1JuZEZOdE1rUlVNR1l6Um0xTFkxWXplWHBQUlhabFUyMXNhR1ZtUldwdlVFZG1jV3RQUTNsSU1uTmtURTFIUzJacVMwbEhaV1kxZFVoZlNXUjNUak5tY2kxVGIyUkRjVlpRU2twdU5GWTNiMUp0VTFGRldXWmlWME5MTVdGSVRGQlhRemhWUkU1TWVUTjNkMFZNTkRSTVMzUmFMWGgwVjJGQ04yNUtXbFZ4UTBwMFRXdHRZV0pIYnpKNGJHdzNOWFZuWVhsbk1IVk1NVE42V2tkTVgweEdObmxETTA1UWFWbFRSbnBHZUZka1dsWk9kSFJDWW5aMWMxZHRVakpGY2kweExXdzJZbEp0UmpSc1kyOHdWWEF4T0ZGWFpXWmpPRTlMWW05aFNqQkxkMVp4TmxrMFZqUmtNa3RIVHpZdFlsOXJMV1JqZFRCSGJsOHRiMHBCTjNSaWNrNXlXbVZCTUhSNmVtTkVaR052VFZaTGNuUnhiV1JYYWt0dVUwdHpVbkF3Vm1RdFRHMUlTa1pXVkd4Q1RFZHlPSHBIZERGaWNGTkRUbXBNY0VZNWRESnFaR3hPTkVZNFZsaEVMV3QzYzJGTU1WUkNZalpGUVdZMVYxWnhTVVZJTWt4c2RsaFRWVVp3TVc5dk0zSTRjamRWVTFoTlJsb3llRVprYkdoc1VqUk5UVVE1VjBOTGQwMWxVbFJWT0hWS2VGaDNaMk40VkVGWlZFSkJUVmROUzFSRWFqUmpTWGMxV1V0S2R6ZDJhWEJyYnpGVWVtOUVTamhCVkc5UmQwMDBZV1p1WnpGMWMzQmpORmw1VTBNemJFcEdSME0zVFRCR05tOVNNbVl6ZEVNeU1scHBRamhUYlZCVExWVTVSRU5oTUZOeWRWUjZZa1JrZWpNMlEwSm5iM2RzWlUxU00yeHVObkJQY1UwMldXMW5OV2RDY25BM1VrVklXamxHWTJobVdGRklPVUp1UVRoWlZXUXdVVFo1U1VGak1FWTVTekp1Y0hReVFrOVdVMXBUWDIxUU1rUmlXakZVU1MxelUzSnBNMjl1WVRaa1ZrUlhTSFJZTVMxak9XZFZVRUpRY1d4MFVGOXBSMUJtYVRSTWIwbDNWMWRGU1ZCcE9HNUxYekZXV0RsZmJ6QjBVbVJFZEc5UlRtTndWMFpKUkRKNFZrWXdSSEpKWVVsNE0zZEJNbTQzVjJsR1RFbFlORjh0VEROMmJrSnJkMDEwZUZkcFYydElMV3BDY25wcVdXWkVWMGxVWVVwbFlqSjJkVXROVjFKWVNIWklOWEIzWkVkd1prOU1NMkpXWm1wMVZsRjBWVzA0WlU1WWNHRTNNV3B1YTBoaU5sSm5PRXQwUzNWMVpIUnVjMmhGZEU0eVdXMVRNbVEwUjJwcVRrOVZUMUZFU0RaZk5URnRiVEpRZVVoMVMzTklXSEJ3VGxaM01VWllTVXd0VmpWMmRsbHdkbmd3T1RkNFJsbDFkVzFXZDFvNFJWWnRSM2htTXpOSFowZHJkVlkyWlZaRlkxRnNaVkF3V0dKbU5EVjRUVmQxYkRrMlVWTk5TR2RYY0hvNVJVUkhVbUZ4WmpobGEyUkxkbWR1V1haMGVVOVJNMHcxYjNCelRXaDFjRkZRUmtscVRFRklha1U1T1Zac1RHRjRURjlPYVd4bVdrVmhhR2MxZW5obFRXSm1UMVJpZEZCRmVrVlhRWGc1TmtOcmIzVkVNVVptTVY5d2JVMW1WM0pXWlRaeU5VRTFaRlpFYjFReVlWTkJWRjl4YkdWSlgyUTBaMjVpVVhwclVIRlFNelZ6WjFadlFYa3lWVTF6Y1daVGQxYzFkazVWZERjM1JUbHFUSFZSZW1OTWNUTTNNVmhKVmpCc2VWZzNhMlpTWWxGelVGUndUV0Z1ZHpGelVXUnVWVWd6WDJ0dGRYcFJURGhqV0hwNVMxQnVPV1JHVkZCdE5XVm5ZblJXVVZoR01VVTJYMGR2TjFkWVIxaFNOMlJ2UjJkRk1uSmxjVGxpYm5GNFdsaDZTbWRpZFZORWRqSnJjVTg1Tmt0UlNsa3hlamQ0TmtkaVNYRXRNRVF4Vm14MFNrWllaeTVOVjBOelRVeDVNamQ0TmpKdFZqQjZZbTlRWXkxUi5wYWtKbExQN01UMmJyZkVKV2ZHNmdETWg5YmVhSzhiUV9IcDFWTVJpcGJNIiwiZXhwIjoxNjkzOTI2MjE2LCJpYXQiOjE2OTM5MjU5MTZ9.4z1ZGuxP8jJZ7WgNbIJq4zpEZrFYMXG6o_7upHJGoes",
    "callbacks": [
        {
            "type": CallbackType.TextOutputCallback,
            "output": [
                {
                    "name": "message",
                    "value": "Scan the QR code image below with the ForgeRock Authenticator app to register your device with your login."
                },
                {
                    "name": "messageType",
                    "value": "0"
                }
            ]
        },
        {
            "type": CallbackType.TextOutputCallback,
            "output": [
                {
                    "name": "message",
                    "value": "window.QRCodeReader.createCode({\n    id: 'callback_0',\n    text: 'otpauth\\x3A\\x2F\\x2Ftotp\\x2FForgeRock\\x3Ajlowery\\x3Fperiod\\x3D30\\x26b\\x3D032b75\\x26digits\\x3D6\\x26secret\\QITSTC234FRIU8DD987DW3VPICFY\\x3D\\x3D\\x3D\\x3D\\x3D\\x3D\\x26issuer\\x3DForgeRock',\n    version: '20',\n    code: 'L'\n});"
                },
                {
                    "name": "messageType",
                    "value": "4"
                }
            ]
        },
        {
            "type": CallbackType.HiddenValueCallback,
            "output": [
                {
                    "name": "value",
                    "value": "pushauth://push/forgerock:Justin%20Lowery?l=YW1sYmNvb2wMQ&issuer=Rm9yZ2VSb2Nr&m=REGISTER:53b85112-8ba9-4b7e-9107-ecbca2d65f7b1695151603616&s=FoxEr5uAzrys1yBmuygPbxrVjysElmzsmqifi6eO_AI&c=XXD-MxsK2sRGa7sUw7kinSKoUDf_eNYMZUV2f0z5kjgw&rD-MxsK2sRGa7sUw7kinSKoUDf_eNYMZUV2f0z5kjgw&r=aHR0cHM6Ly9vcGVuYW0tZm9yZ2Vycm9jay1zZGtzLmZvcmdlYmxvY2tzLmNvbTo0NDMvYW0vanNvbi9hbHBoYS9wdXNoL3Nucy9tZXNzYWdlP19hY3Rpb249cmwVnaXN0aHR0cHM6Ly9vcGVuYW0tZm9yZ2Vycm9jay1zZGtzLmZvcmdlYmxvY2tzLmNvbTo0NDMvYW0vanNvbi9hbHBoYS9wdXNoL3Nucy9tZXNzYWdlP19hY3Rpb249cmwVnaXN0ZXIaHR0cHM6Ly9vcGVuYW0tZm9yZ2Vycm9jay1zZGtzLmZvcmdlYmxvY2tzLmNvbTo0NDMvYW0vanNvbi9hbHBoYS9wdXNoL3Nucy9tZXNzYWdlP19hY3Rpb249cmwVnaXN0ZXIaHR0cHM6Ly9vcGVuYW0tZm9yZ2Vycm9jay1zZGtzLmZvcmdlYmxvY2tzLmNvbTo0NDMvYW0vanNvbi9hbHBoYS9wdXNoL3Nucy9tZXNzYWdlP19hY3Rpb249cmwVnaXN0ZXIaHR0cHM6Ly9vcGVuYW0tZm9yZ2Vycm9jay1zZGtzLmZvcmdlYmxvY2tzLmNvbTo0NDMvYW0vanNvbi9hbHBoYS9wdXNoL3Nucy9tZXNzYWdlP19hY3Rpb249cmwVnaXN0ZXIZXI&a=aHR0cHM6Ly9vcGVuYW0tZm9yZ2Vycm9jay1zZGtzLmZvcmdlYmxvY2tzLmNvbTo0NDMvYW019hY3Rpb249YXV0aGVudGljYXRl&b=032b75"
                },
                {
                    "name": "id",
                    "value": "mfaDeviceRegistration"
                }
            ],
            "input": [
                {
                    "name": "IDToken3",
                    "value": "mfaDeviceRegistration"
                }
            ]
        },
        {
            "type": CallbackType.ConfirmationCallback,
            "output": [
                {
                    "name": "prompt",
                    "value": ""
                },
                {
                    "name": "messageType",
                    "value": 0
                },
                {
                    "name": "options",
                    "value": [
                        "Next"
                    ]
                },
                {
                    "name": "optionType",
                    "value": -1
                },
                {
                    "name": "defaultOption",
                    "value": 0
                }
            ],
            "input": [
                {
                    "name": "IDToken4",
                    "value": 0
                }
            ]
        }
    ],
  stage: 'QRCode',
};
export const pushRegistrationStep: Step = {
  "authId": "eyJ0eXAiOiJKV1JIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IlB1c2giLF1dGhJbmRleFR5cGUiOiJzZXJ2aWNlIiwicmVhbG0iOiIvYWxwaGEiLCJzZXNzaWKVFNRQUNNRElBQkhSNWNHVUFDRXBYVkY5QlZWUklBQUpUTVFBQ01ERS4qZXlKMGVYQWlPaUpLVjFRaUxDSmpkSGtpT2lKS1YxUWlMQ0poYkdjaU9pSklVekkxTmlKOS5aWGxLTUdWWVFXbFBhVXBMVmpGUmFVeERTbXhpYlUxcFQybEtRazFVU1RSUk1FcEVURlZvVkUxcVZUSkphWGRwV1ZkNGJrbHFiMmxhUjJ4NVNXNHdMaTV1TXpWSU5ISndaMFpFWldKdlpuWjNNSFpsV0RSbkxuUkpVMFkxTVZFM1ZVdHNTRXN6WmxjelpuaExaSE01TUZOdmVUYzRNMHhhY0U1eWNIcEhVRmhrYXpGRWJuVnlNa3B2V0ZReGJucFdhblZLVm5NNFdsUlZkMlJPWlRGUWVsTXpUWEJHWDFsSU9WbDVZWGhGVjFCc01VaE1Oa0pXTmtoU1dVaEJVRUpoYTBVNWJuRmhORFIwWjBWalRubE1YM0IxVm1WaFIyaENjMmhvUlZkd2RVVlFNbEV0WW1Gb1RYWndZVTFhV2xJMmJHcEVkMHBVTWkxMFVGUk5aM0pZVTJ0MVluTkJNVUYyZEc1SlZUQTJjbTloTjNWNFZqRmpNVlpqVDNkd1IyOXpOMlJNYmxwbGFpMWxTR3BzV0hWR2QybG1XV0pLWlVacFZHeFZWbGN6ZDBreGNHdDNXRUZCUkVKS2FITnpVbVo2WmtaSFEzVkNTVnB6VkdOYWNsaHFXRmszTkdaaVpEWldSVGRoUzFaaWNtWndTMUZPU3psRFlXYzJTa1pPUzFjME9XVmpTbU5ZYTB4SFFrczFOMWRLYzFsWGJWZzRUbE5PUWxOcFIxcDJZMnhUV25wZk9GSjVSMFV3YWs5WmIzVnRRMWxSV1hWQ2NGRk1WbVkyTlVWMlNFZzFZMlZQVkdkTVJGQjBkMGhSY1U1VGFrZFhhV1ZIT1ZSdE1FTjJkbEJYU1ZGMlNubG1RMW94UjBKQ1IyNW9hbTgzUlVsNlh6aHRNakpNYW01SGVFNTZiRFpaV1V3eFZYRndibEZZWmtoT1ZFcHBaemQ2YVVWYWEzVnJkbWRoY1ZrNFZUWlNiamwwTW1SNmNreHlVSGx2UlVoM2RsUlJWVFZmWjBKNlYyMUxaVTR4Y0dwSmRtaE9NRlZMUW5Sc1oyOURabnByUmt4TFVsbDNhMUl0YjFrMlVqWTNXREJ6YzBGamNGbFpPRkJDVXpGSE5VVldSMDQ0ZW5SeFlWZEhkekpMWlhoMU1tMHRjemh1T0ZKMGRITlJkVEZvWDFobVptaFJZblZTWTJRMmVXZFpObkJHYzBSSWJtTlFZMWd4Y21saVlYQkNlazlrY1hsWFEzcGxWMHhFV1Y5c2IyNU1VamxrTkdKNWRtNDBVRUl0TjNKSVJXVlVaMkp0V1VKS04zUmlhMHBFUm00NWVIRnJlRnBOVjJ4cFNVMWhObXRaVTFoSmNVcGtaRmMxYzNKWGFqSkVVV1JHYjNwa2VFMVVjWGx0UVhOdmNrSmhNM2R6T1VWcVUybFBSSEYwZUMxdE0wRkVNMlZRU2psbU9YSkRhMjExUTJ4UFZUbDNTV0YzTUZSM00wMTNXVGRxVFRsMFoydHVRa3N0ZFc1amVXUnhNR1JJWnpoaGVuUTRNemhsWjNRM2NIcHRSRGxhWDBNNVlsbFVTbkpWWW5KeVRVRjNlWFJDTm5oQlNUSmhWblpQVGpaSVVrcE9PRzVLVWxJNVYyWjFTRVJJZWtaWk5GaDJWMEozYlVwbVUwRjRNVmswTW10cVdFNVVTakprVG5KS1owbHJZazQ1WlUwMlVYSlliblZpWW5CRlpXWkRRVjlqWDBSdlVYbHZNVmh1YmxJNExWTjNZWHBKZVRSUWFYVkpOMHg2TTNJM1ozWnVNMFUzZHpSamVsQTRVbDk0WTJkaFYzWXRjM2h1Ym5oeU1WOVRaVkV4V25RNVJXUjFaMmgyUzNOS1p5MXdWak0zYTNaWmMzWXhTMWMzTm1NemRGQTBVRzgwTUhkQ1drOXJhMlJET0d4dVFXRk5iRFYwYmxkMlRGWjJZbFpPVW5sc1JXczJja2Q1Y2xSb2VrRnhTa3hPU1RReVgwUnBXblkzVnpCWWNscHlTVkY0TTJKNU1VeFFNUzB0Y3pSZldqTXRUSE5vVEVweVRGUldZMnRIZHpCNE1GazFXR1p3UkVSemRsSklORWxuVGpWQ2EzbDBSa3ROV1VWdk9XSnNVbmRNY25RNGRFUm1ZMnM1YlROS2FuSkVjMHhNVjBoaVFqY3pRM0l5ZWtVMWJFTlRZV1YwVXpFMllUSkVkR0owU21oTFNsVklkbWR4Vm5adFJVeFlWRkZCTkhOYU1XZ3hjbWx5WXpscGNFVjNNbHByYkdzMGVFZEhXRXhyYUdGUmFDMXhWSFI1TjI5S2Iyb3lOMVZ1VUdka1NqZHBaWEV4T0VGalVGaDRUMEpRT0hvNVRHWXhjVmRuT1MxV1RVSk5ValpYYldFM1IxZHJhMDgzY1RkbE1tNTJlSE5wWkdaWllVbzNURjl5WW5kdVRVSmFVVTVQYmtsMlNWWmtMVjl5UVc4d1VHOTNaR2hMYm10Sk5FRkdNRTB3VEVsTk1rWlZRVGh0Tm5jM2RFNDJWMHRLTm05WFNtY3RXVkJuYkY5R1dqbFFTVmQ2Y0dWblNqWlFhMHBwTm1nelVIaHhkVWhRUzAxMVdrSmxSVkpUTWxJMVdYTnVjbWxUZG5SdWVqSmFja05DUmxWbmFGaDZUbDl4UkhBNGRYRmFZbEUyU1ZKZlNIUkhYMlZIZURKMU1EZGFhMDluTFRsb1R6SlZhSEZ0UWkxSmJ6WjRVSFpwTUdKWk56TmhMVEJ5WXpZM1lVOWxjRkJLTTFFeFdYSmtibmw2ZWtGVWMwWTVkRkJNTjBoNlRUZzNaM2hVU25ORVREVkhSRUpuYzJweVgxTkZjV0p6TjBNelRtNUVXVWhCVEc5UlNqWk9WVWhXVGxjNGExVnhPV1UzYkdnNWVqUXdjRW95TWxOVFdrdGZZVk56TWpoWVJFODFla1ZGZUhsNk1VUmFVbFUzVEZaVlNtOXNkVE5mZWxOSVpGOWZMVWd5YzNKMGEwWjJTMlJUTkRaTGNIbGFlazlYVjA1RVVuRkVWMDFQZFVseVIwb3RTbmhNUzFSYVkyazJTRVpFZUd0MlVISjJiazB6TW1SaWVrSjNPWFJaWW10cFl6Rmpja3B5YW5kaWNsTldjbkZJU0VWU2RrOVNZelpHTmpKS1NEZEZPWGR6WVRka2R6RmpZWE5XTTJwMlRFOU9RVGRqTW5Oa1lsSkRYemxXTUhKTGRYZHRiM1JLTjNOcFJuQlJiVXg0YWxONmFUZ3paa3R0UVhSb1RuY3piRXRsZWxadVpsTkVOREV4V0d0NWNuVm9TMHd3YTI1c1lXeEtOMVZSWWs1MGF6VXVUVVIxWDFkTVoxRk5PRlF5UjNsNlluSjFZalJKVVEua2tNemRNczdKLU5vOTg5QmFTVUxfb1N3TmxsOElaYmprdTZXWVFtQm80QSIsImV4cCI6MTY5NTE1MTg4NiwiaWF0IjoxNjk1MTUxNTg2fQ.kxHz4cYFMfoSmZVL1KtrmVG-_oU4E8bEjNbdSZe_Niw",
    "callbacks": [
        {
            "type": CallbackType.TextOutputCallback,
            "output": [
                {
                    "name": "message",
                    "value": "Scan the QR code image below with the ForgeRock Authenticator app to register your device with your login."
                },
                {
                    "name": "messageType",
                    "value": "0"
                }
            ]
        },
        {
            "type": CallbackType.TextOutputCallback,
            "output": [
                {
                    "name": "message",
                    "value": "window.QRCodeReader.createCode({\n    id: 'callback_0',\n    text: 'pushauth\\x3A\\x2F\\x2Fpush\\x2Fforgerock\\x3AJustin\\x2520Lowery\\x3Fa\\x3DaHR0cHM6Ly9v9807987ddzLmZvcmdlYmxzLmNvbTo0NDMvYW0vanNvbi9hbHBoYS9wdXNoL3Nucy9tZXNzYWdlP19hY3Rpb249YXV0aGVudGljYXRl\\x26r\\x3DaHR0cHM6Ly9vcGVuYW0tZm9yZ2VLmZvcmdlYmxvY2tzLmNvbTo0NDMvYW0vanNvbi9hbHBoYS9wdXNoL3Nucy9tZXNzYWdlP19hY3Rpb249cmVnaXN0ZXI\\x26b\\x3D032b75\\x26s\\x3DFoxEr5uAzrys1yBmuygPbxrVjysElmzsmqifi6eO_AI\\x26c\\x3DXD\\x2DMxsK2sRGa7sUw7kinSKoUDf_eNYMZUV2f0z5kjgw\\x26l\\x3DYW1sYmNvb2tpZT0wMQ\\x26m\\x3DREGISTER\\x3A53b85112\\x2D8ba9\\x2D4b7e\\x2D9107\\x2Decbca2d65f7b1695151603616\\x26issuer\\x3DRm9yZ2VSb2Nr',\n    version: '20',\n    code: 'L'\n});"
                },
                {
                    "name": "messageType",
                    "value": "4"
                }
            ]
        },
        {
            "type": CallbackType.HiddenValueCallback,
            "output": [
                {
                    "name": "value",
                    "value": "pushauth://push/forgerock:Justin%20Lowery?l=YW1sYmNvb2wMQ&issuer=Rm9yZ2VSb2Nr&m=REGISTER:53b85112-8ba9-4b7e-9107-ecbca2d65f7b1695151603616&s=FoxEr5uAzrys1yBmuygPbxrVjysElmzsmqifi6eO_AI&c=XD-MxsK2sRGa7sUw7kinSKoUDf_eNYMZUV2f0z5kjgw&r=aHR0cHM6Ly9vcGVuYW0tZm9yZ2Vycm9jay1zZGtzLmZvcmdlYmxvY2tzLmNvbTo0NDMvYW0vanNvbi9hbHBoYS9wdXNoL3Nucy9tZXNzYWdlP19hY3Rpb249cmVnaXN0ZXI&a=aHR0cHM6Ly9vcGVuYW0tZm9yZ2Vycm9jay1zZGtzLmZvcmdlYmxvY2tzLmNvbTo0NDMvYW019hY3Rpb249YXV0aGVudGljYXRl&b=032b75"
                },
                {
                    "name": "id",
                    "value": "mfaDeviceRegistration"
                }
            ],
            "input": [
                {
                    "name": "IDToken3",
                    "value": "mfaDeviceRegistration"
                }
            ]
        },
        {
            "type": CallbackType.PollingWaitCallback,
            "output": [
                {
                    "name": "waitTime",
                    "value": "5000"
                },
                {
                    "name": "message",
                    "value": "Waiting for response..."
                }
            ]
        }
    ],
  stage: 'QRCode',
}
export const oneTimePasswordStep: Step = {
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IkRFTU9fU29jaWFsTG9naW5XaXRoT1RQIiwib3RrIjoiNXRzbnMxa2duOWgxOWVoOGZtbThrNGszMnEiLCJhdXRoSW5kZXhUeXBlIjoic2VydmljZSIsInJlYWxtIjoiL2FscGhhIiwic2Vzc2lvbklkIjoiKkFBSlRTUUFDTURJQUJIUjVjR1VBQ0VwWFZGOUJWVlJJQUFKVE1RQUNNREUuKmV5SjBlWEFpT2lKS1YxUWlMQ0pqZEhraU9pSktWMVFpTENKaGJHY2lPaUpJVXpJMU5pSjkuWlhsS01HVllRV2xQYVVwTFZqRlJhVXhEU214aWJVMXBUMmxLUWsxVVNUUlJNRXBFVEZWb1ZFMXFWVEpKYVhkcFdWZDRia2xxYjJsYVIyeDVTVzR3TGk1NGNUWlFlWEJvU2t4TFlVSnZhbEEzTURrM1JVSlJMa00yYW1nNFZrWlNZVkozZUVKSVpURlNWQzFXYVhoMmQydENVMlZRWVUwM1RrUmplRFJIWVY5eU5ESTJhRzVDYVVObGNEQnlVekI2T0RBMlNFZDFlSEU0WDB0U09Fc3pabmx0YkV3d1FWZHlhMlpGVDBsRGNVaFFYMDFXWlU1elRsbDNObVZ5VkROcWJXRlBNUzF2YVdKQ01UVnlUV05GVVVaVVZVaGtkelpPYzBkaWRHazJOMDFrTVVzeGVrWlFMVUZwTkRCb2MyWlRZbUozVTJ4cE5GbE5TazFOWlZWNFpYaEpWbTFRUjJsT2MzY3RXbWRaV0hsMk5HWXRWVTh6YjE4NU9VUjVTRGxHWXpKd05FRXlWWGhRU2xjMVkzazNWazlFU25kdE9UVlZUMTlpTkVGSldIUk1NSFJoYUY5V1ZUbDBVVU5LY21OME9URkVkM2xtWjFneU1IVktOV2RJYzE4M1NDMTNhVVpoVEdvMVlqVkdUV2d3Y0dGTk1YTjJkVEpsWWtkRlVFRmphblp3YzBaRFVrMWxhMUpXYUVwRll6aGlWVUpUTkhwQ1pIWkpkVUZOWlU1cFowUTJSVTh6ZWpSRGNqWlFaWE5oZGs1TmJHczBRV1ZGTUUxeGEzTTBkVXhaVFhCaGJrUlNNVTFKU2t0UmVHVnRZMjgwTlVsa2FWcHRUMFkyWmpjMVVFZGZTRlYxV1RrdFYwTmpTUzFPWVhaVFkzTnhRa3hEWWsxWmFUaGtTRmRzY1dKeE4yeElibUpMVWtVdFRsb3RVR2xFYVVkT1YzbGxUblE1VFV4dE0yVm9ZV2N3ZUVaWk5reEZRMUZVUm1KTlkzSkJWbVozVGpFNFgwVm5ZMmsyWTFGcVozZE5VVkZEY1Zsa1JXUmxSblJqV21kV1dqTmtXVVJJV0ZGQlkzZFNha1oyV1RaeFRrVmxVa1JHV1d4NVZtSldUbWM0V0hwQ2FYbHVNVzlIYm5sTWJUSnZXVEZxY3pkRlVWUkxhM1ZXUjFOVmFHSm1VRVI1YzJZeVYyMWplVkZvYzNsNVlrRTVhRmRxYVY5V1YyaHdZbVJaVERkclNrZ3RXbEE0ZGxSNGJVaDZUSGxKTkdwb1owUkRRVU5IUW14c2JUTjVTMms1T1ZKMFpHVnlhbUp6V0ROaFNXSnJNRXhVWmpGS0xYWlBjSGQyYTFsaVZrWm1TakJuYlVWcmFFTjJZbmx2U1hSc2NFOVdibGhPUldKSWJGSXdTRkZCY1hka2RubFpUa1IzVFRSMVgyaGpWbmRsY0ZGb05tWllZVWt4WVVoWlRrWnFaVVoxVFhod1VXcElhMEZxUWxNNWVGaHlUSGxNU1hWUVpYTlpla3BIT0VNNGVqUjJSRmwzWW1VME5EWlFiV010TXpKSFYwNU5XbkpDT1U5dk1ERnJhREY1ZVVGcmNtTmpTamgzV0VFNGJrNUhOa3RHVEdob09GODJla3gxYlhCemJVTXhXamx1VjBWYWRGZ3piMWRmVEVkYU1raERORXBoYmw5TVMzQnZhMjlEVmxaRmJXNW1aUzFsUVVkaloybDFaVVUwZVhCaWIwNU1ORzFYZFU0eVJUaG5WMnRGWVdacE1FOVBialZTY1cweGJVcERTaTFpU25CMFNsWkNUblZ5WVVWWkxXcE5NRTUzWVcxMFNXZzJjMnhZY2s5SGNHSm9lWHA0Y0RnelgyNUJZbmR5UjJkdWFqTldTM2xKYTFCTVNVRmtiMU5UVkdOd1pGVmZUbTF3VTFSdlltZG1iV1JpVkZoR1JtNWtabUp4ZWxKVlZtWlBhVEF5VVdJNVMzTm9ZMGhwVWpSRU9IWldOekF5U0ZvMk5GcG9SSGRzTTNoMVpqQllXVGcwZVRsSVpITlJlV04zY210WVZUVTJSekZpVDJoaWR6ZFFRMGMyUTNSaFFqSk9VelpWY0hkd1RXRmhURWhrVkRKdFIxWmxNVE5mVGw4M1dVdEpOWG8zZUcxdlVFVnRkMHhWVjJRNFl6SkdkVTkxVVU0M01HZEhPVmwzZFd4VVVUQXpWVE0yUlhSdVUxYzFYM1J2VkZBNFFVWmtaMUZHYjFORVdrZFRNRTQ0UmpkeVNqSm5RbFJXZDE4NVNFNDJlWFowVlVOYWExTjFUbWxFY2pOUFJITkNka05SUzJjNWMwSTBkazF6WmtweFVHZGtablJwVjJNMVpYQklhSFk1VGpWbU5YZEJSSGxyYkhnM1pHRXhjMmxYZWpsV1ZISXhaRll4U1dRelRsSlJVbGhZUlUwMlFrMTVhMWQxYVVScmFHVnRWWGwzZFdSU1UwZEhOMmt0TWxkVE5YQkVkRGRyTldGWGVFeG9VVzVOTUhkSFEwVnlaMmwxV25ReFkwUjVTRUZSVTJrM1gxOTNXSGRTY21kVFVHZFhiR3BwZG01cVRuSnZRVzF3ZFZWYU4zYzRjakJvU2pkSlpURllWVlE1YVhwS1VFNUdiV3RIYTFKalRFTm1RemRNVW1aRk9XUktVVFo0UzNOeWR5MXBSV2xHZVhVNFpqQkNZVVZmT0RkdWIzUjZOSFpaWTFoelgwUTRUMFZaVTA5RkxXbDRTR2d6WTNOMVIwaHVOVkUwWTNkd04yOHhSWE5FVUZGbVQzbzJPRjlwUkVac2IzWXljR0Z6VlhOTWRWZzNkVkp3TjNsSWQwSlVla1psUW1OaWNrMVVMWEZJWmpsWVZXWnZTelJ6TUdkd2JFNDJXSEZpU2xjelJGTmxVbTVGYURCcmNtSm1VbHBzY0d0a1ZXVnlaRU54TkVsU1ptaHpVbmh6YVRKTVVWOUJhM0Y1Y3poQlN6aEpielUxTldFdE9ETktiME5RZVRaV1UwZDVRMTk0Y1ZKVlluVjZUemh5T1hKTk5Xd3pVWFZ0TTFKMldXRkxaazVuU0ZSdVFrVTBNWGxxVUdSZmRrOTJSM0JWVlhsalpISTNjWEZGVDBWWFREbHNOMnRVY0hoaVdsOUNTWEJGUVVwNVRHbGlRVXhqVkhCR04zaFVZM1p3YkhwVFNHcHRPVmhETW5CQlprdHhkRXg2VHpGb2J6QlhZVnBEWVZWWFowZHRUMHBRTTAxYVFqVjVTWHAxZFZCYU9IRmhOekUyV0dScWQzUTVhR0pwU2t0Vk1uSlVkRkUyWDA1eWVXMDJRalZrVVc5TlREUkxXVmw1UmxweVVWODNUV0pSYUVabmFtZE9jekJFZERGaGQzUXpiMGRrWkZjNFIzRlhiMWxqUzJvMU1FRlpjSGs1T0hoTWFrUk1aMUpvUzFaTVVqbFhPVEpmTUdKQ00wRnRabWg1ZGxJMlVtZHFOeTFQYURkWUxUY3pSSGMzZDNwMmJEWndSR05VU0dKUFJVVmxUVFYxUlZCc1ZVMU5jbGhoU2t0TlRGOWhSelUzYWxkVlpqbGlkMjVXVFdGUVlsVk1jbFpPVjJoMVdVZHVTM2R0T0hGSFpUQnNNbU14YUV0RldHZGphSFJSYTAxdFIxRTFiMngwTFdwcllUSndURFIxWnpsd1JrbEhZMDR4YkdOdFRuRmZlVEpSWm5Sc2JuRXhSV0l4VFdoR1VEWTRPRE15WTA5UloxbHdXRGRLT1VwRFJVdEViMlp0TWtKalZYQklOVEZSYUhSeFVHNW9YMjVITkV0UGQxRjNhbTFaU0c1R1QwRkRSM1ZKZERRM1lUYzJSR0kzUlZsQmFrb3lkVEl0UW1aWExWSjZSazVxWlhsM2NFdzFWWEk1UmxWa05ISkpWMDk0TFhjeWJpMVJiM1p1V0hOWFNUSmpOR055YkRSYVptMUZNVjlaV2tGc2JWTlZOWGQzUW04NFRtbzJVR3hLVjAxWVJEbERaMlp0UlZkV056Y3lWMGxqTTBrMlVYTlhOMGN0V2tFeE5XeGtiakF4VTNNNVQzSjRZVnB2VUZGRExUQmZkR05JWW1ORFFrWklSbXBMT0ZwUU9GRnFPVEJ6Umxkd1ZraHhNbGd3TFMxS1NVRjNjazgwUVRSU2JEaG9iRlJFV1ZvNVJtVllXblZPTTE5V2FtVnFVRmxoVFZJd2NtSndOblpxTVU0eWJYbGthblJOWXpabmRteFlXRWgzV21kMmJFUlNaVFY2U0VsVVRWcFFRbEp2ZWt4TE9XZG5WRE5LTW1sblNqbHRjWFpoVGpGbldFRnZkRUp4TUZoclQySlphMk5DVm01elJrbEhORGhSYkdKNVZUVnFZa2RUUm5aSVRXOUVNMVZrVDJWV2NFOVBNRUV0ZGsxM2FrSjRlWFZETmxCc1dEZ3hjRXQ1WW5wT1FVMUZVbTFYWkhKUFozWjFia2t4UVRoalNtSTJUa1pwTVVFelZVRnJaV3BHVmxjNWMzZEJSSHBWWmxaNlkxWktZMUEzTUVsaFJVMWZkMngzYjFkRmNtcHJZM0F4YkZkcVJrRjBaRGs1UTIxTVRVNVhRemxEVjJFeFFYbFRlVWxVWWxJek5rNVJUSFJqYUV0aE5XeFlYMEZuVjJrMlEySlRYMUExTWtWTlQyWk9Za3N3YkVKRFZHWmhiV0pGWWxOQ2NUaDJXR3B0U21wdlJYZGxObVZSWlhSSFFYSlVkRXA1YVRoZmNUQnBlVVV3ZFMxUlRHWm9kSFJIU1ZKQ1JHSXdSVlV6VGpCbVNFMXBVVkUyVTNWVmEzRnNia3RYTTA5MlVVZDNiVFl3VERGcE1VUkRiVkpSTUd4Tk1YcEpTRW94U1VRd1ZTMXpTMHN6UnpKR01rMDNhWFZMYm1Wb1dHaEhUMGMxY21sd2JtczRiR0ZuV0hrM1ZVTXdaMmR0VFhZd2NEaG5NRU5rVG5BMlpFTnhXSGwyYkd4VVpreE5aR05VT0Mxb05rdDNObEl4TmtseWRIVjJWMUl0UVdWME1DMXBibUZKUkdScVFtcFFRMTltY2twMmJrbHhZbWhEYlc5NlFrTmlXVmh4UXpKbE5VTklRV2RTTUdkNmMyRmxkVE5VWmtSRFEycHhkVUpQTldoRU5sOUlWVjl1V0VGcWVURnNORlpvVUhwb1JUVTJRbFp5Y21Jd2MycGxkVGh2TWxrM01FaFRVa2xFZDBwVk5WQjBhbEpCVkZocFNscDJOekpRVVdWcVEzaFJNRUkwUWxaZmQzaEZUakF0UlRCbGFVeE1TVGxyZUZndFVVSnpTbFkzTjFsRU9FaDNVMGRUZEdSd1gxUmFVMFJLUVdKelpHbHpZV2hqVVU5VFYzQlZYMFZrWTFOckxWUkJXbFJGVEUxUmIzQTVPVzlMVGxaUk1VNVNWV1pMWDB0ZmQwcElRV1J5U2xOWU1HRjZNVEpzVW5kYU4xUTNNWFZ1T0Zsc2VWWk1VbEJKY1UxTWVsVlBYMmxhYW5WVVRqSXdlRWxuTVdGbVlYZFBSVXhIVkZoSmVsRldTVUo0ZEhKYVpHSkJRbXR5WVdWQlJEUm5SbFUxY0Y5UGJVWllRVE5WT1hsRE5sQTFhbEl6WWpKV05WQTNhMVE0ZDJOemJGSnliRTFNTkhGcVVsUllNV0pMTVhsTVp6VndZMWcxTmtoVWNuaEpNM2hSUWxBMVMxSkVRbEJSYXpSTFJVeDFPVk5hY1VGeFFXVldXV2czUzBGc1UyRkpXQzF5TkdWYWJXdzVMVmh0ZFdOeGQyaHFaa2RSYm1Wa1dFWjBha2xLTkVkV1RGaDFUM3AxVG5aU1N6aEdiQzFaY25scmJuWlZhWFpCU21wSlNEaHdiSFZVZGxod2RFSkNiV2hVZVVGSWQwaG5NSHB6ZDFsdlZqbExMV3BVU0VSR1dFZHdZV1F0VUZkS2MwOU9UVEpaU3pnNWJuWTBiMWxxU0ZOUVNGbHVXSFJNVEZRMFRXSlpia3BaVFd0YU1GQk9Na0ZTTUZsd2FVbHNhM05DYTB4V0xVRnRTMjQyZGtveVVuUjJObTF3TnpsUmRFeDZSVGs0UjFWZmQyRktlbEYxTkRNMGRrcGlRa2hFTlVRdE1tOWtXbE53Y0hwWWVGUTRlRVk1ZFRWSWEwOU5lblZyY2xCM2VFWk1RMU4wTFV3d2VtMXpXVUZrYUhkWlZrUktaVGhCVG10TlRGbHFORTFGUmxaMGJsbFRiVGRWUlcweVpsUmpRa3RxWmtaaUxXVlFRMnQyU0ZCRU5uVnpkVGRYZFdWb1oxVlZUVVJHVGpWYVlYTjBWRTVaZEc4eGNERnVNM1p1UWs0ek1EbHVXbVYwU1djNFIwaFRablZJV1Y4M2VIWXdhV1V0WDJoUGJYVllRVWRFUkUwMVQxcElaRGg0WjBka1owaG5hbFpwV0V3NWNUWjVjakpITm5wRFlVWk9lVUUwWkZSdFFtTkNlV3QyVUU0dFpsbGZlWEpKVGpoVGNVZHJRM1ZYZW1odlQwdFJYM0pxVmpoTldYRlBiMFJrZFdwcGNGSk9WbWxUZDFObWIwcFBRMFJNU0ZNM1VXbG1VV2hTTlhsYVgxOXZjbEJpTkdSNWFEQXRPVGM1TFhCdFJVdFVSa3gyUkZwbGRIUlhjVkZ6YkdSNFUxVllaVE5MYUhsME1HSmFURTVzVkY4d1dtRnVWMkp3TlhONFNUWmhiM3BwTlhWb1VqQTJVM2M0YmxFMmIwSlBXamg2YUhOaGNFSkpOMTlGYm1SV1VHaGlPV2hvV1dsWGFGUnBNRmg1TkVsNFdVYzBjbVZWTUc5V2NuTnNOMTlrWkRkMVNtTmpMWGt5WkVOU2FYcEhWbkJDT1ZwR1ZuUlpXV0pYZGtkbVFtTmlaVE5MTTNRM1IwcERiRkZrZGtwcmJGQlFTakZSTjJaeVRUZ3pSalExTlZGZk9XSkxja05IVWpWbUxVOXhORWszWm1OV2NITndhSGxsZEhKeFkwOWZNMnBLZEVKb00xSndialV0VFhwRE5pMW1la1kyWldsU1JFSnFNMmhDY0dOS1QyUjRWRTV5TjNGbWR6TjJXWFpoVTBWTmNGRXpaRTg1U1U1WWRFa3hPRGxDUm5sa2VubGlVbmhTTmpWU05FbDVVMGhpYlU5MmNVRjJVVGhtZFVRdGMwSjVXSFpyVmpkM1RURTVkVzFxY3pWR1ZUUXRjRGxSTFRaVGIyaFlWRFZ3WWxWYVNVMVRaWGxpTFZSV2RHVjFYek5ZZVRNeVR6aDVialZET0ZFM05URklkV2xUVFVsSWNXTkJhV2xCT1hWSVUxOXpUVEZKVjFkVk5rWk9PRWQzUVU1YU5uTTNjMXA1UXpkYU5qWkVlREJ3TW5ZeGRHMVFVRzFLT1ZoMFREVkpOR1IyYjAwMU4xcERZMk42Tm0xR2VYSlFUa0pmUlVSbFVsOVJiWEpFVW1oSFlXUjFUSHBtTVZOaVozcERVVXBXU0V4aVNtODFZVnBmV0VKRVkwTXpZMHMwY3paMFREWlJiRkJJVm5kelVrcEthVm8xVVdGMkxTMWpPVmd4ZDJOS05scFdhek5ZZEdveFRVNTZZM2xHU3pFNFpYRm1kVkU1TVV4MWFXb3piamd6WldkV1VVZFphMDlwTm5KME5sVXdibk0xTmxsU05TMXVaemwwWjBKYVpWQjNTRGxXWDBKVldsTkZaMnBYUzJsdFdWUm5kRGRrWkZScFdTMUlNbEpUTjBScGVGaHhYMlZRVkhCSE9VaG1TbkJsYmtadldVdGFZekozWm5GaVFVTjVRamsyTjJ4VE5sUmtZWGxuY1MwMFZVdEtWSEJsZW10NlVIZFhXbWhmTkUxT2FVOW1VWEZaV2xwdFFtMXpVVmR4UlhGVFdrVjRWVlo0V1RoV2FtVmZRMFZyUWtWbFpqWnFNWE5yY0c5S2NHVm5ibWs0UTNCeFEycFRUMVYzWjJablFtOXpkSFJGUXpsTU5VRXdMV3BJVm1wUWVrczNhell4V1c1eGMzTmxUM2N1VFRReFgzcG5lR2hhTmtWV1UxcDRRMTlQYTBKVFp3LlpjSEpEUnBMczNFNEVKb1c4WGY2TXY4RkhKdkZibDVGbmE2LXdmd2NiSjAiLCJleHAiOjE2NzcxNjU3NzcsImlhdCI6MTY3NzE2NTQ3N30.YPVZCdJbqwLp-HcVllCVXSd-j7EdVQ5XZ2ehMlTxjxA',
  callbacks: [
    {
      type: CallbackType.NameCallback,
      output: [{ name: 'prompt', value: 'Enter verification code' }],
      input: [{ name: 'IDToken1', value: '' }],
      _id: 3,
    },
    {
      type: CallbackType.ConfirmationCallback,
      output: [
        { name: 'prompt', value: '' },
        { name: 'messageType', value: 0 },
        { name: 'options', value: ['Submit'] },
        { name: 'optionType', value: -1 },
        { name: 'defaultOption', value: 0 },
      ],
      input: [{ name: 'IDToken2', value: 0 }],
      _id: 4,
    },
  ],
  stage: 'OneTimePassword',
};
export const mfaRegistrationOptionsStep = {
    "authId": "eyJ0eXAiOiJKV1QiLCciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IlBV0aG4iLCJvdGsiOiI0N2xtdWUxbzJlYXI4dTg0anJzdG1vbXUyNSIsImF1dGhJbmRleFR5cGUiOiJzZXJ2aWNlIiwicmVhbG0iOiIvYWxwaGEiLCJzZXNzaW9uSWQiOiIqQUFKVFNRQUNNRElBQkhSNWNHVUFDRXBYVkY5QlZWUklBQUpUTVFBQ01ERS4qZXlKMGVYQWlPaUpLVjFRaUxDSmpkSGtpT2lKS1YxUWlMQ0poYkdjaU9pSklVekkxTmlKOS5aWGxLTUdWWVFXbFBhVXBMVmpGUmFVeERTbXhpYlUxcFQybEtRazFVU1RSUk1FcEVURlZvVkUxcVZUSkphWGRwV1ZkNGJrbHFiMmxhUjJ4NVNXNHdMaTV1VjBNeU9XTTRZMFJzWlhsUFowNDVTRGhtWjNOUkxsWkJOVko0UjJaSFpFUjBVRFZWZDBFeGJVdDNiRWR0UjJSTlltbzRWbE5aUkdabU9IQnBSV1ZCVjI4NUxVbDBkRFpJVlRGME4xaERSR3BhVDAxSGExSlJNa0ZCU25sSVZsVkJaRnBEUzFaUU9Xc3RTV2RNVHpabVRHdGxiVTVoWnpkRVF6QmpkRTlWYUV4WFJHcHRNMFpKT0ZGbVFrOHdiakZFTkcxT1FqTktRMUZHZURWVVVETTJaMGQwWkMwMFVVaDJaWHBHVVhGemNYQnVVVzVNUzI1d1prY3lPRzFFWTFKdFRXTnBiakZ4WmxCT1ZHaFBWR2hyV0RoWFdHaDRNR1F6ZVZwRWVGOXNVRXRHU2tKWFpXNWlYM0ZtYkU0M1ozTkdNalptVlRBdFJuTjNjMDlvYWxJNFVFMXFRVE5vV0VoV1pHUmxjRXhaUlROR1pFMUNiakZpYTBobWFXOXVSRVp2VGs4emQzcHdiV1J5VVRKdVdIWTFMVmc0UkVaUGJtOXBSMGc0VFZOcU0xVllZa1pNUkV0V1pWQnJiVEJFVW10ME4zTTNiVXBTYUdoblVrSkNVekkwU0ZGcGVGZDRjRUpoVDBJM1lVOUROMjlETVVGRVdVRllTR1V0VFZRMGJubEVOV1pzV21STk56VnRhRVV0TlVneVl6SklTMXBKYURaZllUVTFWMlYyWmprd04zZGxiRmRRVXpsNGFtcEVjVzloTFVkamMyRnJZMVV5YjJSZlMwMXdMVnBzTkhSalJuWmZhR2wyU0hrelNsVkROMTgzTlRsd1UwUkVNMkYwUzFodlgyUmpWeTFETmpGSmVrRmplSFF3T1cxbllYcDNXR1JxV2xoRVlXVkhkbVJJU1hobmVtRlJRbTEwYzJSb1dFZ3hOalYxTkRrMk1URXdka0ZIV2tKNGJYYzNaRE5wUVRCclEzSkZTbVZHV0hGM2Vtd3RWVTVVZVdsWk1HWjZaMHBVV25kWFRERk5kVXBQVTNWVlZHRlFPWFIyUjNaQ2NEWkhiM1pzVDNNMU9UTlVaV2hVUm10aFIyMUZjMkY1ZEdWa2NFSmpOa3hQZFVocVoycFFUSGRXUTFKSk0yZFpaWGM1TTJaU2N6Rm9kV1JVVGxOUFQxSTNRMUpPTmtoTlNrSlJRV2haWDBJelNGcHVka0pDZW5WaWVrVkRUMk56VlhaSmFGODNZbGhVZEV4eE5HRjVTM05QV2tWSGJtVTRZVk14WkZWWlV6Y3hWM0V3YURCNVJWbzFVa3d3VjJoNFVUSXhSSFZtYkZoelYzQkhhRlp5U1ZsQ016SlBSbVowY1RadFkzZzJkbTUyVW1aR1VIUk9hbU53ZEU1dE56bFdkek5FTUV0eldEZDVVRUpWWWpaMFkyOVNORkpqZWtKRFptSlBjV3hFU205blpYWlZOMHhhYUZndFYwVjVWR280UTFCaWRsTlpSUzFOV1VSdVZEbFdlRTFyUjJGYWJuWlFVV2RsYnpSaE16RkxTbXRNZG1sbWRHOW1WbTl3UTA5M1NqQnVlVTUwVURKVVgzQlpMa3RLWVZsbFVrRlpSMVJUWW1sSGIzbFpMVzltVTJjLnh0U3hoMVh1blFaUEI1WUZIdVlEbHpHRUJvZFNCNEtaT2RfcG1NWlFlVFEiLCJleHAiOjE2OTgxMDODEwNTE0Nn0.QdH6gR4bCTLStkZ08BjADk3zv4kX32I",
    "callbacks": [
        {
            "type": "TextOutputCallback",
            "output": [
                {
                    "name": "message",
                    "value": "On this page you can choose to register, skip or opt-out the second factor authentication method selected to protect your account. If you \"Skip\", an MFA method will not be registered now, but you will be prompted again on your next login. Otherwise, if you \"Opt out\", an MFA method will not be registered now and you will not be asked again. This choice is not recommended."
                },
                {
                    "name": "messageType",
                    "value": "0"
                }
            ]
        },
        {
            "type": "ConfirmationCallback",
            "output": [
                {
                    "name": "prompt",
                    "value": ""
                },
                {
                    "name": "messageType",
                    "value": 0
                },
                {
                    "name": "options",
                    "value": [
                        "Register Device",
                        "Get the App",
                        "Skip this step",
                        "Opt-out"
                    ]
                },
                {
                    "name": "optionType",
                    "value": -1
                },
                {
                    "name": "defaultOption",
                    "value": 0
                }
            ],
            "input": [
                {
                    "name": "IDToken2",
                    "value": 0
                }
            ]
        }
    ]
};
export const recoveryCodes: Step = {
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IlBhc3N3b3JkbGVzc1dlYkF1dGhuIiwib3RrIjoidXVnOHNxNjNwNGs2YnRzN2NoOHZzYnVjbDQiLCJhdXRoSW5kZXhUeXBlIjoic2VydmljZSIsInJlYWxtIjoiL2FscGhhIiwic2Vzc2lvbklkIjoiKkFBSlRTUUFDTURJQUJIUjVjR1VBQ0VwWFZGOUJWVlJJQUFKVE1RQUNNREUuKmV5SjBlWEFpT2lKS1YxUWlMQ0pqZEhraU9pSktWMVFpTENKaGJHY2lPaUpJVXpJMU5pSjkuWlhsS01HVllRV2xQYVVwTFZqRlJhVXhEU214aWJVMXBUMmxLUWsxVVNUUlJNRXBFVEZWb1ZFMXFWVEpKYVhkcFdWZDRia2xxYjJsYVIyeDVTVzR3TGk1SVdHRXhaek5EZUU1MldGZFhVblpzV0ZOdVNtVm5MamRuWkZkUmFWRlZPRmhQUWsxcFpuZEZjMWx5T1U0MFlWaHdjbkJ4V0ZGT01IQlZaa3BTUjB4WFVUUnBkR3BNTFRKblVGUkJlbEpPVW0weFJTMVlXRTlzVGxoRlluZEVSVmxvUWtSTlozbFlZVWxaVmpZdGRGSmFOVmMxU2twbU56RTVTSFZGVFV4T2VHeHlWSFpHVkVJd1UweHBTVWxQWWkxMFExY3RaVFZ2ZWpWM2NDMDVUM0ZKZW1KUVUwazRNRk40Ukc5bU9FRllNbWhoVVhCeFVrVnFSMU5oWlVsaVEzTjZNWE53WWpOVGExUXRZVFpVTTFWUk0wTkZjRnBPWDJGWmRHOUVaekJRVW1ad1FVOW9aV2c0WmxGVGNWRTNiVWxmYzJOSGVURnJZVTVUWWxjMkxVRlhZVll6YVdoUVNDMTZjbHA1VDJaU1EyUlBTVVpPVnpoMVdXeERUWG8zVFRaemFWODJZVlpSTVZRelltbzFiV3BDTFZrMlIwbDNSR1kxU2pSeVh6SlpZMWxsYzBsWVpVcGhhSFJHWlRSUmVUVjBlbVp5YkRWd1Z6WTNUa3AxVEZCMVYzSlVObkI2WDFBMGRGbG1UM0l5WjNkRE1UbG5Wa1ZxYW1KNlZVUkRkM0l3VERsWFNtbE9NM3BIZUZoeUxWTk9WMkp1YTBscFVtNVBPRWRoVEZSaWVFSk1iWFl0VEc1dk5IQjJRbGxIVWprNE5rNVdjMFJqWmpKVWFrZDBWVE5mZERSbVptRjNaMnRyWWtOclJtdDZXRFV5Wm5RME0ySlFabGRMWmtaRE1Fc3piRlpoT1ZGalozbGtVR3c1UW5WeU56bDBTbmR5TWtwSGIxZEpTRXB2VDJWbWIwOXZkekJTUkRkWWFFbDBTMVZoTVMxdFZuTlpaRnBDVG1oWVpuQnNlVW96TTFGRE5IZzRiSEV3VG00NVNWOW5TV3hRVEhJMmNHRTJaM0JRYUc1aVNXVkpkVGhRTUZac2FtSjRjbk00Y1MxRlEycG5VRU40ZFRWSVdHZEVOVVZxTVRKelozVjVWV0Y2WDAxbmVVNWhaV3Q1Wm14b1MydG1RbkpsYWxOamJuWmtSRFphWjJoTlowaFpjVE5EWm5oUE9XZ3dkbXMxVWpSME0wRktTbTl4UVU4MlgzVkVTRlpTVWpWNVdWZHNaVEZNUWpadVpFVnhOVTQzWW1WMlRGbFRZbTUzYW5sTU9HVmxaMDlmYnpJMWMxcG9iRTl1TVRaamRrTTNlRmh6T0ZOSmNFcDFVM1paVjJaVWJqazBWR3hHYmtOVWNFMXdhMWcxUVdOSVFWSnZWa3hNV2xSdk5YRXlNbEJpZG5oRGIyaG9hRkJKYTJGcVIwMTZlRmh1Y1ZCSU1VNHRVVGRRT1VSRk1WYzRXRzV1UjE5RmFrbHhORmRtVjFOeFluRmpjMngyT1haWU1XZGxSR1ZXUlZGNVEwdE9jRWRJUzNWaFZXb3dWbDk1WDNaemVWUldiRFJUVW5CUFpUWkRla3hqYzBsM0xXYzFVMk5STkRscGNERmxiVmxGTjI4MVJGVldZazlNUTBKNVdVUTFiamhEUWpOVE4xaHBkSFV3YUVORVMxOWtVM1ZUWmpSQlJreFVhalZ2VjNFMlpETnFlRFIzWkVwRlozbEVYM2R1TlVoSk1FZGxlbmg2Wldsb2RHOVdjVXh1WTNKS2JHUTVZVkZ6TFVKSFlrbHRXRk16UXpkM01rTkNjemMxUjBoT1l6UXdVa1JFUVZneFN6UnVObTVwZDAxTFpXRnRVbkJZTVZOR1dtMDVRVFJTUW1Rd2QyNUVYMHR6VDFsVUxUUjFTMGQwWkhGNGIwNXZUR2hUUkd0TlVrNXRNMEUwTFRoSVFreHhhMEpHYWkxcVMwRnpkRWxPZDFoV2IyaDJNR3gzYXpGSVNFOW1ZMXAyVDNKMmRUQXlXamMwUlZJMk9GODBlV3BNTWtwUFowdzNSVzVHZUVwdVYzaDRUR2RrVlZwM00xSm5hbTg1Y0ZkV2VXVXhRazlvV0hCdlREZzFRM0E0TW1nd1drSm5XRkZMV1RSTU0xOWFiREp1YTFBMmNYbFpNbHBFYkhCSWRHaFlhRFJ6Y1hBMGFYTkZkVGhSTnpjMlNYY3diVTQxZURGS2RrRnRlWHBZVlhCTGRVbzNTVTQxZWtWSmJGSnNWRWx0VlZNdFFrdHNTSGxvVTJKR1RtSlhkMEZvZDBaSk5uQjJlSEZZYTBKVWEyWkxjVlppYlZvelNIQlhWRzlYTURWeWFHWjZTVGsxTjBnMlpqSmxZVmxaWVdGb05sUnpibWxKVlU4NVNsSTJSV2xIZG5scmQzRkZWbkoxWVV4b1VsRnFRMUptUldSbVRGRlJRVkV5WW5oTlJFcG9kMlV5WW5wMlVsbHFNV2hmVWw5elVEaGZVWEYwYVhnMlNHOWhiRlpVT1ZKdVJXeGpSMlZFYm5seVVrTTJRa2hHZVdJeE1XcGhSbXBuTTBKS2JHUlpXak5NYWxaT01VUlFTekpoYWpCcU16VnRWeTEzYTNGVVQwRnJUV1I1ZDE5WFZFSXRWekJ0WVV0TmJFUm9VM1J5T1ZKcVZETlhVek5EVmtWRFRFdzBiMUpPTW1SMk1UUnlWRk41UkRscVNrUnhPSFJyTm1kb1gwUjJTV1ZKWm5Kd1NHdzFlRWs0UzJ4dWEyeEVjMnd0Y1VORWJEY3hVbEJCT0VoaE1pNWljbEk1YlROWk5WY3hRa0paU0ZOVlJrMW9ObmRSLmtCNjlONWZuMXdBQm9WU1JQMDcxTXdyeHJrSFpjSjViXzBCdzQxMHRYb0UiLCJleHAiOjE2ODczNTc3MzksImlhdCI6MTY4NzM1NzQzOX0.8QcUHytp7PWmxLWVVg6F3vxbnCGv_99m15LDXpsXjDE',
  callbacks: [
    {
      type: CallbackType.TextOutputCallback,
      output: [
        {
          name: 'message',
          value:
            '/*\n * Copyright 2018 ForgeRock AS. All Rights Reserved\n *\n * Use of this code requires a commercial software license with ForgeRock AS.\n * or with one of its affiliates. All use shall be exclusively subject\n * to such license between the licensee and ForgeRock AS.\n */\n\nvar newLocation = document.getElementById("wrapper");\nvar oldHtml = newLocation.getElementsByTagName("fieldset")[0].innerHTML;\nnewLocation.getElementsByTagName("fieldset")[0].innerHTML = "<div class=\\"panel panel-default\\">\\n" +\n    "    <div class=\\"panel-body text-center\\">\\n" +\n    "        <h3>Your Recovery Codes</h3>\\n" +\n    "        <h4>You must make a copy of these recovery codes. They cannot be displayed again.</h4>\\n" +\n    "    </div>\\n" +\n    "<div class=\\"text-center\\">\\n" +\n    "CyFrHnLq2x\\n" +\n    "</div>\\n" +\n    "<div class=\\"text-center\\">\\n" +\n    "x95uukzd3C\\n" +\n    "</div>\\n" +\n    "<div class=\\"text-center\\">\\n" +\n    "FHmdsD8khD\\n" +\n    "</div>\\n" +\n    "<div class=\\"text-center\\">\\n" +\n    "s77okhRxLX\\n" +\n    "</div>\\n" +\n    "<div class=\\"text-center\\">\\n" +\n    "XuTOVS00K6\\n" +\n    "</div>\\n" +\n    "<div class=\\"text-center\\">\\n" +\n    "CWmtqmR34b\\n" +\n    "</div>\\n" +\n    "<div class=\\"text-center\\">\\n" +\n    "N9v9L1ultI\\n" +\n    "</div>\\n" +\n    "<div class=\\"text-center\\">\\n" +\n    "ciA0MUvRRn\\n" +\n    "</div>\\n" +\n    "<div class=\\"text-center\\">\\n" +\n    "iVowPQpu7V\\n" +\n    "</div>\\n" +\n    "<div class=\\"text-center\\">\\n" +\n    "RsRY6CkwF3\\n" +\n    "</div>\\n" +\n    "<div class=\\"panel-body text-center\\">\\n" +\n    "        <p>Use one of these codes to authenticate if you lose your device, which has been named: <em>New Security Key</em></p>\\n" +\n    "</div>\\n" +\n    "</div>" + oldHtml;\ndocument.body.appendChild(newLocation);\n\n\n',
        },
        { name: 'messageType', value: '4' },
      ],
    },
  ],
};

export const webAuthnAuthenticationStep = {
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IlBhc3N3b3JkbGVzc1dlYkF1dGhuIiwib3RrIjoiOGdpaDJxdHJhNzltZTgwa3ZqZGg0MTlkbTUiLCJhdXRoSW5kZXhUeXBlIjoic2VydmljZSIsInJlYWxtIjoiL2FscGhhIiwic2Vzc2lvbklkIjoiKkFBSlRTUUFDTURJQUJIUjVjR1VBQ0VwWFZGOUJWVlJJQUFKVE1RQUNNREUuKmV5SjBlWEFpT2lKS1YxUWlMQ0pqZEhraU9pSktWMVFpTENKaGJHY2lPaUpJVXpJMU5pSjkuWlhsS01HVllRV2xQYVVwTFZqRlJhVXhEU214aWJVMXBUMmxLUWsxVVNUUlJNRXBFVEZWb1ZFMXFWVEpKYVhkcFdWZDRia2xxYjJsYVIyeDVTVzR3TGk1TWJsQkxWR2h4V2tab1ZUTkhUa1IyVVdwRmR6RlJMbUV0ZG5GSVIyMDRlakZKYlV4WWRFZHljbTEwY0dST2FtWnJSalV3ZW01cmFYb3pjV1EzYldOV1ZURnRNVUp3YkhwR1ZGVk1kRzh6TFRaeVJrdHBTMnBSUW5ST2FITTRWMlJzVjI5d1gxZzNjVTk2WjJKYVpWYzVMV1kzVmtFdFZESkxVM0pTTkhoR1VHZElWV3hJYlZGYWFGaDNSRWd5VUZseFZuaHJRV1pUY1RGWVlXUlBSSHBDZVZWUGRuRk5ibWR5VEdJelpEQm9SMjVZWWtSUVFqTktibGxDWmtneWFEQlJURzl6TkdKV1drMUliRzlFVjNGd05HeDZWV0puZGtaVVJuTnVkR1JoUkRaaGJrUTBTbVYyVDJKME5YZGhVbUZrTmtST2QzTkxkMGREY0VwS1JYRTVNM0kwZEZrNGVqaGZXbUV6TVVsSmFGSXRNR0ZNVW5OeFNYSmFPVlZ0TlRFME4wVkpRVEkzWTFORmVGWTRTRmxtU1RFMmJpMWpjVEZ3YzNob1duQkhURWhWTjFONlRXODRSVzVITWxRMVMweGxSVm80VUZSWFUxQlZRMko2ZHpJMVMyTklRbEZsUWw5blVXTjFkMGRZVGtWdWFsVllNVjg1VGpkcFRXNDBabmw1ZERBNVVVVmlXVzg0VlRSMVNqSnpMV05OVmtaaldubENRbmx0YUU5bGJEaFRObU5FVUdSSVJIWlBTVE5aY0RKcWVtNTJVSEJpVmxBMlpVNXBla2Q2V0ROYVdrUnJWMU5JUkdNMFEwZHZWamh4TFdGeFNHWXllWE5LZGtwSWFHUk5hWFpLYlc1Zk1HWnBRa2hhWnpobk1HeGpWVzAxV21Jek5Wb3liVkJCV1UxUE5VaDFOVUpGT1Zab2N6QlhOelpvYUU1V2VraFBVMGszVmtKSFJ6bHRRMnRYY3kwNFNqUTRTVnBaWVc5aVZuaHhRbTFEV0ZSb05WTnpUV2RUTnpReU1qbGZUME5NVDJ0clJWY3dOWEpoTjIxUGJVeHpSR1JKVERONFVrNTVVREoxYkdOclFqUmFkelEzUzFGclZpMXpVMWRYWWtsblUxRmpWVmRUWlUxTGFuUmhPRkJCVUVOR1JFNW5TM0ZSU0ZJM2RtVnllRVIxZDNaTVp6QkNSbFZMYm1OZlQyUjJRazlFZHpFNVpEbHBRMWs1VHpSRVR6bEROR2RrWm1WeGNWWkZka1V0UmxacVRYTXRka1IxU2s4MlEyVkpiRGxOYm1keE4zZDRSM1JqT1VWNlMyUjNaVWRDT0dRMWVFeGlkazlsUzI1SlUyc3RhamRIVmpOdmRqQnFjREZhTWsxSU1rbzBUaTFsU0dwVVRDMURUV1JhU2k1MllUbDJRMjlLVmtrME1HVmlObkJSVEU1RmMxSlIuRFRJVUdaRnlrVUd2STlROVVvbFc1ZElMTWU3YUx2UFVZQVJzS3dUMy15dyIsImV4cCI6MTY4NzM3NTU2NCwiaWF0IjoxNjg3Mzc1MjY0fQ.dizHBQ9lBW36ZuOdvOH3rwE83zBcXNtHIjjYAIdFLmU',
  callbacks: [
    {
      type: 'MetadataCallback',
      output: [
        {
          name: 'data',
          value: {
            _action: 'webauthn_authentication',
            challenge: 'gNO22N2EuBw1eL9JXOZ0zZjflAQwtGLsMW4nFZJOl1E=',
            allowCredentials:
              'allowCredentials: [{ "type": "public-key", "id": new Int8Array([101, 22, 32, -44, 119, -77, 35, 104, -122, -104, 41, -78, 76, -61, -32, 46, 93, 16, -39, 55, 57, -97, 67, 44, 113, 54, -113, -94, -26, 38, -62, -29, -27, 83, -93, -96, -9, 25, -108, -38, -70, 37, 125, -7, -118, -37, -10, 52, -67, 41, -116, -44, 46, -116, 119, 117, 113, -24, 67, -12, 76, 30, -13, -44]).buffer }]',
            _allowCredentials: [
              {
                type: 'public-key',
                id: [
                  101, 22, 32, -44, 119, -77, 35, 104, -122, -104, 41, -78, 76, -61, -32, 46, 93,
                  16, -39, 55, 57, -97, 67, 44, 113, 54, -113, -94, -26, 38, -62, -29, -27, 83, -93,
                  -96, -9, 25, -108, -38, -70, 37, 125, -7, -118, -37, -10, 52, -67, 41, -116, -44,
                  46, -116, 119, 117, 113, -24, 67, -12, 76, 30, -13, -44,
                ],
              },
            ],
            timeout: '60000',
            userVerification: 'discouraged',
            relyingPartyId: '',
            _relyingPartyId: '',
            _type: 'WebAuthn',
          },
        },
      ],
    },
    {
      type: 'HiddenValueCallback',
      output: [
        { name: 'value', value: 'false' },
        { name: 'id', value: 'webAuthnOutcome' },
      ],
      input: [{ name: 'IDToken2', value: 'webAuthnOutcome' }],
    },
  ],
};

export const webAuthnRegistrationStep = {
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IlBhc3N3b3JkbGVzc1dlYkF1dGhuIiwib3RrIjoidGljM3RrYTU3NTE3azM2bnE3NjA3OWw2bjUiLCJhdXRoSW5kZXhUeXBlIjoic2VydmljZSIsInJlYWxtIjoiL2FscGhhIiwic2Vzc2lvbklkIjoiKkFBSlRTUUFDTURJQUJIUjVjR1VBQ0VwWFZGOUJWVlJJQUFKVE1RQUNNREUuKmV5SjBlWEFpT2lKS1YxUWlMQ0pqZEhraU9pSktWMVFpTENKaGJHY2lPaUpJVXpJMU5pSjkuWlhsS01HVllRV2xQYVVwTFZqRlJhVXhEU214aWJVMXBUMmxLUWsxVVNUUlJNRXBFVEZWb1ZFMXFWVEpKYVhkcFdWZDRia2xxYjJsYVIyeDVTVzR3TGk1bVZFaHViRTlWVjNGa0xVVkpZWHBNU25GNlJXTlJMa2hpWmpjdFMydFJkbWQzT1VSUlZUUk9UazkyYVZKUGRpMXllVm80TUVSd1lVVldUWFppT1RnNFJGOUdRekIzVjJwdlgwOTFjV1J3Y1ZGRFlXZEdWazl3ZW5OamJYbG9jekp0UTNkMExYbElORGRCYmpCR2IxQTNMWE5tYmtGMVZHZHRTWFpTUTBOV1UwRjFkVzVrZUdSWGJtaDVOMGN6YmtSRFIybEpUMEkzYWtSUWRYaFphMVUzUmtaWUxYSTFXa0pUZUVrNE9HOVdibGw0YW5GbGRXTTFOR3htV1RablRXMHhWMHBwU0hwVlkzbzBSakpCZG10NFEwbERSa1ppZEhoek5VaHBNMDV2WVhjd2VFRlRZVWcxWVhwdlNrbEJWVWRUTVdSMGVUbEJUMU15YVRSelRVVkNRa3B0U0V0UmRqbDBaalJ6TFZWamJFVkdWMEZ5WlRjeVJXOHplRWt3ZW5KWmVrSXhaR2hpVmpsRVlVbGlUbmN5WW5kNVUwRnZZemc1YTFGa2VEWmxWVU5yVTI5ak1FOXdWMHR3YldSTlJGazNVMlZvU1VwaGFXWk5iVW8wVnpCSVR6Vkdaa2hFTlVKeFEwMUJPVEZPYTNKNk4zcEtMVnBvYVVoalVEY3hUMjVzVkVSNE1YWlpTM294TkdoTlZHWnhhbEYxYTFKTE5HRTNWSEpYYWxGTE0zZG5aREV6TWpWT1lrNW9OV2t0WkhGUlVpMHlWbVpIWDJkbFFVOVBPRWt3V0hGWGFYTmtNMmhJWkVoU2IwTkthMjlKWW5JMWQzQmtPVXhXWTNCYU1tcG9TRjlsUmtaQ2VEQnBUemhqUVd0a1V6UTROMWR2UkdkUU1YbFROMXB5YTNacFgzb3dNME54ZDNWSVJYaEtSVGMxTTNNMFkwaEpUVzFKVFVreVpIbzFjamRDVGpBeldDMDRaSFIxYUZadVoyUldUSGxwVlVveFdubHBTMjV4U2kxVlpqbFVWemxVYTJWWVlUZENkM2h1ZGs1S09HVlNOMk5JY3pKRVJ6RmtWazFRWm5nNFJTMVpTbmhuUkZwUFdHRTNOM2RtZGpOcFdUWnZRbFU0YmxGcVZYTXRabVozWWpoaVdUUndibFl4VWxSdVdqaFFRbU5KUTB4NFVuTkpOWE5PWHpOU2NFRmtkbE5oYzJVd1NrZEdObUV4VGs5bVNHOU1haTFQU0VGTGN6WjFiVzFQVm1jMmVFUTNjVjlqYnkxYVVscENiRVJ2ZFVsdFJFVk5jMUJJTVdkVFRtRmliR042WkZKblZrWnNlbXhXYURac05sVk5kRnBsTFdSS2NXOXhWamxUVkdGVGVUbHZNMDlQT1U1SGEwbHBOVlppWDFOV04wNHlaVXRYUTJkVWNWcEtiVU5NTVdGMmFISndha0ZZUzNsNExWRnJMVlZEVDBRMk5sazBWMVpaWkVjNFdWWk9TbE01WlhwV01FUTJPVXBPY0ZWMlluVklXbE5EUkdkcGRqQjFaV2MzTUdsblVHeDVTMlY2VDJsNFRYQjJORUoyZUZaMGRFaDBUWFpwUm01R2RWbE9TVTFLVFVGTlZrOHpNR1ppV25Vd0xuUnBhall0WjBGdWRFYzVhemQzVnpCMVZrOHlVVkUuUzFwTGZ2cXdPXzVpTm10aE5ER0lxWVl6S1JjYXZEendIbzlqTEdSZFA0dyIsImV4cCI6MTY4NzM3NTczOSwiaWF0IjoxNjg3Mzc1NDM5fQ.CH0CHzW0Xk82ncr53x6n2MeHhK539VVCqHjpyn39uc0',
  callbacks: [
    {
      type: 'TextOutputCallback',
      output: [
        {
          name: 'message',
          value:
            '/*\n * Copyright 2018-2020 ForgeRock AS. All Rights Reserved\n *\n * Use of this code requires a commercial software license with ForgeRock AS.\n * or with one of its affiliates. All use shall be exclusively subject\n * to such license between the licensee and ForgeRock AS.\n */\n\nif (!window.PublicKeyCredential) {\n    document.getElementById(\'webAuthnOutcome\').value = "unsupported";\n    document.getElementById("loginButton_0").click();\n}\n\nvar publicKey = {\n    challenge: new Int8Array([-9, 108, -90, 2, 110, 98, -76, -65, -1, 93, 24, 82, -58, 109, 92, 24, 8, 87, -78, 83, -55, 42, -58, 73, -21, -22, 35, -109, 46, -2, -97, -78]).buffer,\n    // Relying Party:\n    rp: {\n        \n        name: "ForgeRock"\n    },\n    // User:\n    user: {\n        id: Uint8Array.from("NmNlNjdlNzYtYWVjYi00YjA1LWEzY2EtNGIzZjRlYTk3NDNk", function (c) { return c.charCodeAt(0) }),\n        name: "6ce67e76-aecb-4b05-a3ca-4b3f4ea9743d",\n        displayName: "6ce67e76-aecb-4b05-a3ca-4b3f4ea9743d"\n    },\n    pubKeyCredParams: [ { "type": "public-key", "alg": -7 }, { "type": "public-key", "alg": -257 } ],\n    attestation: "none",\n    timeout: 60000,\n    excludeCredentials: [],\n    authenticatorSelection: {"userVerification":"discouraged"}\n};\n\nnavigator.credentials.create({publicKey: publicKey})\n    .then(function (newCredentialInfo) {\n        var rawId = newCredentialInfo.id;\n        var clientData = String.fromCharCode.apply(null, new Uint8Array(newCredentialInfo.response.clientDataJSON));\n        var keyData = new Int8Array(newCredentialInfo.response.attestationObject).toString();\n        document.getElementById(\'webAuthnOutcome\').value = clientData + "::" + keyData + "::" + rawId;\n        document.getElementById("loginButton_0").click();\n    }).catch(function (err) {\n        document.getElementById(\'webAuthnOutcome\').value = "ERROR" + "::" + err;\n        document.getElementById("loginButton_0").click();\n    });',
        },
        { name: 'messageType', value: '4' },
      ],
    },
    {
      type: 'TextOutputCallback',
      output: [
        {
          name: 'message',
          value:
            '/*\n * Copyright 2018 ForgeRock AS. All Rights Reserved\n *\n * Use of this code requires a commercial software license with ForgeRock AS.\n * or with one of its affiliates. All use shall be exclusively subject\n * to such license between the licensee and ForgeRock AS.\n *\n */\n\n/*\n * Note:\n *\n * When a ConfirmationCallback is used (e.g. during recovery code use), the XUI does not render a loginButton. However\n * the webAuthn script needs to call loginButton.click() to execute the appropriate data reformatting prior to sending\n * the request into AM. Here we query whether the loginButton exists and add it to the DOM if it doesn\'t.\n */\n\nvar newLocation = document.getElementById("wrapper");\n\nvar script = "<div class=\\"form-group\\">\\n" +\n    "<div class=\\"panel panel-default\\">\\n" +\n    "    <div class=\\"panel-body text-center\\">\\n" +\n    "    <h4 class=\\"awaiting-response\\"><i class=\\"fa fa-circle-o-notch fa-spin text-primary\\"></i> Waiting for local device... </h4>\\n" +\n    "    </div>\\n" +\n    "</div>\\n";\n\nif (!document.getElementById("loginButton_0")) {\n    script += "<input id=\\"loginButton_0\\" role=\\"button\\" type=\\"submit\\" hidden>";\n} else {\n    document.getElementById("loginButton_0").style.visibility=\'hidden\';\n}\n\nscript += "</div>";\n\nnewLocation.getElementsByTagName("fieldset")[0].innerHTML += script;\ndocument.body.appendChild(newLocation);',
        },
        { name: 'messageType', value: '4' },
      ],
    },
    {
      type: 'HiddenValueCallback',
      output: [
        { name: 'value', value: 'false' },
        { name: 'id', value: 'webAuthnOutcome' },
      ],
      input: [{ name: 'IDToken3', value: 'webAuthnOutcome' }],
    },
  ],
};