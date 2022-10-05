---
layout: publication
title: Research on Minecraft's global bans
description: ???
---

# Research on Minecraft's global bans
**Date**: 02.09.2022<br/>
**Author:** Aizistral<br/>
**In collaboration with:** ejaussie, also known as British Empireball#3906

While I wish this could have been conducted sooner, this is the first verifiable ban case where I could contact the person banned. Some couple weeks ago I even purchased second Minecraft account with the sole intent of committing what would appear as bannable offense and being reported by one of my friends afterwards, which I sucessfully did; however, no action from moderation team followed. At the time this lead me to conclude that reports are not yet actioned on, which was perfectly explainable by [unfixed exploits with chat reporting in 1.19.2](https://www.youtube.com/watch?v=gH_q7ZuCJs0). This case might indicate that reports are indeed actioned now, at least since the date of this research, but it is also possible that ban occured due to automated chat monitoring on Realms (see {% include link_with_icon.html url="https://help.minecraft.net/hc/en-us/articles/8047895358605-Our-Commitment-to-Player-Safety#h_01G95X76WR1PM97XBXDE7G25KE" svg="/assets/icons/envelope-fill.svg" name="Our Commitment to Player Safety - Proactive Moderation" %}). More details on that in ["Speculations"](#user-content-speculations) section.

Initially ejaussie was banned for 3 days. Until this day specific messages he was banned for remain unknown to him. All we know is that he was mostly playing on Realms in days preceeding the ban. After contacting him, he kindly agreed to assist me in my research. All data presented here is published with his full permission.

This research sets the goal of answering the following questions:
<ol type="1">
<li>Can Mojang's API be used, without account access, to establish username from UUID and vice-versa of the banned user?</li>
<li>Can banned user join online servers on 1.19 and prior?</li>
<li>Can banned user join offline servers?</li>
<li>How can fact and details of the ban be established by user?</li>
<li>What data Mojang provides as ban details?</li>
<li>Does ban somehow affect other responses to unrelated requests to Mojang's API?</li>
<ol type="1">
<li>Can user fetch their keypair (used for chat signing) when banned?</li>
<li>Can user change their skin when banned?</li>
</ol>
<li>Is it possible to establish that an account is banned without having access to it?</li>
<li>Is it possible for account owner to prove to someone else that their account is banned without sharing their access token?</li>
<li>With or without access, is it possible to establish that account was banned after the ban already expired?</li>
</ol>


## Login and authentication
Logged in from banned account and loading up 1.19.1 and above versions of the game, we could observe following screen:
![banscreen_cut](https://user-images.githubusercontent.com/47505981/188138058-b213340d-d77a-4547-a503-76ee248152be.png)
After clicking on **"Acknowledge"** button the game displayed title screen. As expected, multiplayer and Realms buttons were inactive, and hovering over them displayed **"Your account is temporarily suspended from online play"** tooltip.

Logged in from banned account and loading up 1.19 and prior - there was no ban screen, and multiplayer/Realms buttons were active. However, any attempts to log into servers failed with following disconnect message:
![failedtologin_cut](https://user-images.githubusercontent.com/47505981/188138986-25cec27a-1a5a-42c9-962e-435ea6eceb54.png)
It's worth noting that this message is processed fully on client side, i.e. the server is not aware of why exactly the user lost connection. After modifying the client to suppress an exception thrown in `YggdrasilAuthenticationService#makeRequest(URL, Object, Class<T>, String)`, server rejected connection with **"Failed to verify username!"** message. No exception was thrown in `YggdrasilMinecraftSessionService#hasJoinedServer(GameProfile, String, InetAddress)` on server, which indicates that services responded normally and simply refused to return `GameProfile` details. This is exactly the same behavior as when user does not send login request to authentication services in the first place.

We could, however, successfully join servers with `online-mode=false` set in `server.properties`.

Using 1.19.1 and above with reactivated multiplayer button yields the same results, except that disconnect message client tries to display reads as **"Failed to log in: You are banned from playing online"**. This is due to implementation of `UserBannedException` thrown in `ClientHandshakePacketListenerImpl#authenticateServer(String)` when services reject join request due to user being banned, which is instantiated without readable error message returned. On older versions a more generic `AuthenticationException` is thrown, which does incorporate that message.

## Mojang API requests
Here we tried to perform some conventional requests against Mojang's services, to see whether their response will be affected by the fact user in question is banned. Some of them do not require authorization and can therefore be performed by anyone for any account, others require access token. Read article on [Mojang API](https://wiki.vg/Mojang_API) at https://wiki.vg for more information about those requests.

### 1. Address: https://api.mojang.com/users/profiles/minecraft/ejaussie
- Request Type: `GET`
- Authorization: No
- Response:

```json
{
  "name": "ejaussie",
  "id": "be8dfdb5f72644a79ac9e218a4b3fc83"
}
```

### 2. Address: https://api.mojang.com/user/profiles/be8dfdb5f72644a79ac9e218a4b3fc83/names
- Request Type: `GET`
- Authorization: No
- Response:

```json
[
  {
    "name": "ejaussie"
  }
]
```

### 3. Address: https://sessionserver.mojang.com/session/minecraft/profile/be8dfdb5f72644a79ac9e218a4b3fc83?unsigned=false
- Request Type: `GET`
- Authorization: No
- Response:

```json
{
  "id": "be8dfdb5f72644a79ac9e218a4b3fc83",
  "name": "ejaussie",
  "properties": [
    {
      "name": "textures",
      "value": "ewogICJ0aW1lc3RhbXAiIDogMTY2MjAzMjkzNTg0NSwKICAicHJvZmlsZUlkIiA6ICJiZThkZmRiNWY3MjY0NGE3OWFjOWUyMThhNGIzZmM4MyIsCiAgInByb2ZpbGVOYW1lIiA6ICJlamF1c3NpZSIsCiAgInNpZ25hdHVyZVJlcXVpcmVkIiA6IHRydWUsCiAgInRleHR1cmVzIiA6IHsKICAgICJTS0lOIiA6IHsKICAgICAgInVybCIgOiAiaHR0cDovL3RleHR1cmVzLm1pbmVjcmFmdC5uZXQvdGV4dHVyZS85NTk5YmE3ZDU4NWZlY2I0NWI0ZTlmM2IyNTYxMGZiYzhmYzkwODQ3MDRmNGRjM2RjNzZlNjYwZmFmZGEwZGFhIgogICAgfSwKICAgICJDQVBFIiA6IHsKICAgICAgInVybCIgOiAiaHR0cDovL3RleHR1cmVzLm1pbmVjcmFmdC5uZXQvdGV4dHVyZS8yMzQwYzBlMDNkZDI0YTExYjE1YThiMzNjMmE3ZTllMzJhYmIyMDUxYjI0ODFkMGJhN2RlZmQ2MzVjYTdhOTMzIgogICAgfQogIH0KfQ==",
      "signature": "UJsvqY9EMNs0BBcjxsf4zx0Q3t3o2qYcVD1QxNgqp6C0b+JO6XZ52rJbWE2oZTPk2BXQEY0VVZALby3h4nj+jnRr2WmZxCjT6J0UJiPaWf9vRUsrxuUWEsRiiIA8MoxWSF8YktwYUT+6O6inCO9VwTajaAalf9R1McjljJucDLQ6atZXwu1Iqx4JWAE8ikfTRMR/BzFlBzYYIAT1XAiGyAYshiC9pXEc6k0ImZ2RqzG52z0F27JBZLMaSwziZo317Mkz06lMgiw36h4dfV0Ajee22f24swCAvFixm4E4bebSpuOVb67vPG9AzKFf9SvdtnRBblIX6QCa49SjMI5H7kxgSHpGsb1idoxY9KYdc73TZcyql01peCLNuuG56lXSWjHDmCcbHRzaZfov8rWR2pOksDrUJGQlRQBtE2FaPLGn9+bPE1wwKnSGG5gAaBpKH0P+r2v2srErGKo11jyFn7mQzhsvHcJU3an+fOEW07xNgFG51no4+Tpf8t85Os48XSbEbiGWKwIk6Ymp5bXU8sMNKTkTTyMC2SKXm5MJQvXe3w1koHZNGlCsNt/gSQrP2H5XqgGwzikdSUCZWmWF3RnG5Zj2x/aoHVxOC3o079koI1SXimElZD5sAMnYlrykm9tZs8a5LF65NezUwYwPvK6UUHnDG2GxcRzxB80KwOU="
    }
  ]
}
```

- Decoded `value`:

```json
{
  "timestamp": 1662032935845,
  "profileId": "be8dfdb5f72644a79ac9e218a4b3fc83",
  "profileName": "ejaussie",
  "signatureRequired": true,
  "textures": {
    "SKIN": {
      "url": "http://textures.minecraft.net/texture/9599ba7d585fecb45b4e9f3b25610fbc8fc9084704f4dc3dc76e660fafda0daa"
    },
    "CAPE": {
      "url": "http://textures.minecraft.net/texture/2340c0e03dd24a11b15a8b33c2a7e9e32abb2051b2481d0ba7defd635ca7a933"
    }
  }
}
```

### 4. Address: https://api.minecraftservices.com/minecraft/profile
- Request Type: `GET`
- Authorization: Yes
- Response:

```json
{
  "id": "be8dfdb5f72644a79ac9e218a4b3fc83",
  "name": "ejaussie",
  "skins": [
    {
      "id": "3bd0edfd-e588-43e2-90d4-5e28f08f363d",
      "state": "ACTIVE",
      "url": "http://textures.minecraft.net/texture/9599ba7d585fecb45b4e9f3b25610fbc8fc9084704f4dc3dc76e660fafda0daa",
      "variant": "CLASSIC"
    }
  ],
  "capes": [
    {
      "id": "5af20372-79e0-4e1f-80f8-6bd8e3135995",
      "state": "ACTIVE",
      "url": "http://textures.minecraft.net/texture/2340c0e03dd24a11b15a8b33c2a7e9e32abb2051b2481d0ba7defd635ca7a933",
      "alias": "Migrator"
    }
  ]
}
```

### 5. Address: https://api.minecraftservices.com/player/attributes
- Request Type: `GET`
- Authorization: Yes
- Response:

```json
{
  "privileges": {
    "onlineChat": {
      "enabled": true
    },
    "multiplayerServer": {
      "enabled": true
    },
    "multiplayerRealms": {
      "enabled": true
    },
    "telemetry": {
      "enabled": true
    }
  },
  "profanityFilterPreferences": {
    "profanityFilterOn": false
  },
  "banStatus": {
    "bannedScopes": {
      "MULTIPLAYER": {
        "banId": "579aa9f9-8e6c-4151-bbff-69328c22fdaf",
        "scope": "MULTIPLAYER",
        "expires": "2022-09-02T03:52:21.816645Z",
        "reason": "21",
        "reasonMessage": "Harassment or Bullying"
      }
    }
  }
}
```

### 6. Address: https://api.minecraftservices.com/privacy/blocklist
- Request Type: `GET`
- Authorization: Yes
- Response:

```json
{
  "blockedProfiles": []
}
```

### 7. Address: https://api.minecraftservices.com/player/certificates
- Request Type: `POST`
- Authorization: Yes
- Payload: None
- Response:

```json
{
  "keyPair": {
    "privateKey": "-----BEGIN RSA PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCxwNeCooKjlKHVq07+fegiCTIE\nJqrO6++02JKHJ25cUcQIJT0drTYT/FlNcSlFy7bu/8dycrNv5s7rsoUfso1yKHvGw5cq10gRPY8R\nVxGwXy/speGSWPOT4gi3eMpddeN8zwjPQfy6Pq/Q0Mr9DyzE2wWwlmRUnClZTh7T0ivYzZoAFSXf\nfP3yLZHCgqnHn4SZwWehI7kS9FUKupoWkiwvAHa3aozBuVMvB3cn3G1KIPvcAeDjjRC/XM6TYYsh\njYh21YwXfY0aMhcw8m3ecyxNko/gkQYj1e8M6KWtI0pdtzE+qWPiAKq5ZNaSQw0bWuBZRqwI24tp\nBMwjYHDf+uIFAgMBAAECggEAAJlGcI91ErF7uRFGZxeL+l9fDoIF1cQYLtsC5Vcl6UQyPZfIhKrS\ncY9KSrc8nRpST6xHYvSNc61KmaMkjSaIEPAfeJwsjG2ktcAoFPYe3mH3spudbqWDjoY2os2Smu18\nem1lGXOesw7mfzTQ1jjgnPoi4wUiqeFLx1v6wRpmYOjQ7euXWUDN2cTic+dg8JnF/xRV6gsKbfFq\nNg3YvXLd6yXLgmIupHNIeivfmMlUIs1ZnyqCLNU4at0x6sR31MSddPLpbqy5/W1bZ36eRvRss9Uk\nww0etcvPmrQR/64t0lmY7FgIBctzbtPqI+2bu2209NwDxFZAONimcbcSUcl+YQKBgQD2za8cwS4A\nNk38G86AHjwibGQIB9hCb3Zk7LkEYsVj34QX0Z13kXJoKwXfE7NszoKXLp5GAbd//USxKUA7Rhi1\n8V0XqcBlDzZ+yllZ2TeS4sjAk/UGGuwFGmsOy/4XHy6ogCeNez2xQqz8NXYP8Lq+z5m9bNnUlv/I\n1brCYh/MZQKBgQC4YHjbyAZj/bPW1rx2OYV7R/E9h181txjd42AMOjL9DypuWK1zjI7nAnCc0m9A\nsY9n2QQdh8pCF32NE93vnqKostm3TMsr7G26yJClL539bnIk48uIr03DFMnk3go8Mr2QD3KgY1Ax\nGGF+WZz3U0j/iknsLBOe7yjqhr5I5LRVIQKBgBxxjgnxVZzepVQ13DG1ylZpSYoHZWwarnlpMtWH\nkJo3C2E3Xj+Gern4o1+XRKl4j2JfFAybbAuLI9yLFYT/Sh/F5mWwwaSkATLRnUSWnSoHiv1uz+FZ\nPvRDnC0DY5BEnrr6shRDLNP+DDOw8Z9arhsJj/1dyykOEgKSZ0i5yFJlAoGAcApnxx7RC1gzPb11\n/t3LiHPaXAp0R/8AxG2UgzmmnHLn1PBcTtg+SpEH/7Q82PJNc8zDnHJU7T67E8zb0+3xaFRuyt2G\npSViNNwGUesStdu0z0gB+giVV5O9cC+hxp0K5o0Mmfxf0cXAEPjB0uWweWD+tN6/+ZfZpFLHNSKN\nlyECgYEAnML8WLJZJA6wecA7LezPzDwjCmxMv7KiDgR9ijQpRwQoXdX40JvE1wHlOUjzsjkmHtW7\nEIsCKGa2FsWLrB1aovlZlXOz4+HX316Z4GZZKxk8peoEsIPmdfRbxlLiNJ4GWW5q49SUWBgDcY7b\nPoxmTj+vTohwloyQe85D0/6umRs=\n-----END RSA PRIVATE KEY-----\n",
    "publicKey": "-----BEGIN RSA PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAscDXgqKCo5Sh1atO/n3oIgkyBCaqzuvv\ntNiShyduXFHECCU9Ha02E/xZTXEpRcu27v/HcnKzb+bO67KFH7KNcih7xsOXKtdIET2PEVcRsF8v\n7KXhkljzk+IIt3jKXXXjfM8Iz0H8uj6v0NDK/Q8sxNsFsJZkVJwpWU4e09Ir2M2aABUl33z98i2R\nwoKpx5+EmcFnoSO5EvRVCrqaFpIsLwB2t2qMwblTLwd3J9xtSiD73AHg440Qv1zOk2GLIY2IdtWM\nF32NGjIXMPJt3nMsTZKP4JEGI9XvDOilrSNKXbcxPqlj4gCquWTWkkMNG1rgWUasCNuLaQTMI2Bw\n3/riBQIDAQAB\n-----END RSA PUBLIC KEY-----\n"
  },
  "publicKeySignature": "R8UVmaauFfoFVEJ7bBO31H+A1309vYunODNUAfzRKqpym5ikjE+rX1Vpmq3Zr6LZc4dBRI8bS6BPN5ueE5hzTUfLjUUgxNc/Ayi9WHbSuwe6zjnCX9bRocHOMSYqu1A0eL67sVmVeWKTTiSB4gIBAw/MBMjgwqmRAK5+JD8DDfSjgRN+niokbTcwDsF0P2La6Ipi2oqJ5CuFF0e/gOCseV6XV68V8pM1LMoXRUdSDIbuyl2K99H9/gyieAj3yZxQdK3yP/xHCygNeeSAy5Df5jUaqYTRyMbhfmQVszu59XxEOe6OV7f5WvNf2ygHmmtk32qI5PEg5hYQu/s3j8pa+v4hVS+tPX9zyT6tPlN9oIveTajD22T8n64JqPB11ZzsZyR6AM9BR69J1y3Wmi+W3/krlbSJi4cfJPoFYu3zkmK0tjXhzlY4ts1wg2zFN76STnqbHO1OvB+Y/ErIytnEyhoivisJtRX2WQo8d1BAldDGzonnDhNYkGjJZQd1IjQXfcCgmfXYDjP/bnxToZwFibBIrDilANwTuDroaAj149RY1dJT3H95Uutn9uKSFDXAEoZtvpxdTEwFAMXcQJJ+7ab7BSZWHg1XvP930pr1c8MDHMbVR4DCy6nASFZU+060xtLjoImuP9J1H2Lgxr5se9Kiq+tWme27/21Vv/93/YU=",
  "publicKeySignatureV2": "ZtaVk/FAGhJ8eqdpIYYu6D8Dt4apnLjH5gWW3727myOpnWeY67Fi6yU3pJRaTPx7hVKxQbQkZeI3eHR953NmeToGvECXXeSdmgDQ7OrJegx5x8P8MsmqFUvkjymPLuvaXtUjG0mTyj/2AYZ0zvBj5RQwNop3t5W8M2pdk80HFPd6iN5LrHK7bzNgjhFf06qcQZNYMkVt8yPPImtMwDH+qBK3OM5+sEjNNCfXQm01rAJmo8VyfG6M/J2pID/+rHteM3Eba4y3gjLhwYLmaZPzTQSLGl/bHZVY55GOhe8EpXyZEjhtAZ63/m9mSQIiZr8Z6cQbAFBDMTanwyN2AXygZ/0rU/ioKd6UXz0HHmldE9X38ftLDXlL0P0AnMZSpNf3Q8kBqjAw4WBJCR3B2yK1DKDZc32m+e81SVZsFE2eJUaKoAA/nUChbZreCqt5Jev6xgwWnztjGg8JGQbgGGFbWVRzgSJ9zHnoPqDJfG/RS9fX2JdzACm6XnUHDjJao7zKlHGEFZxhnifhdgIcOXuQ/sloOveqrepx7dEa81/6COy5jo2aDPOJO14mveXEMn2TiNkP6oWuIfDANUJYhGq0odXwDt5j2KwFr/2gvTGLF/oaAX8HWGOaW+qLs7pDXcZDF7VoGyrNumCMVUa/hyI85lGauc8NBP9JJxmkoJC0EjM=",
  "expiresAt": "2022-09-01T22:43:57.025356Z",
  "refreshedAfter": "2022-09-01T14:43:57.025356Z"
}
```

### 8. Address: https://api.minecraftservices.com/minecraft/profile/namechange
- Request Type: `GET`
- Authorization: Yes
- Response:

```json
{
  "createdAt": "2017-03-11T10:38:53Z",
  "nameChangeAllowed": true
}
```

### 9. Address: https://api.minecraftservices.com/minecraft/profile/skins
- Request Type: `POST`
- Authorization: Yes
- Payload: Multipart form data including `variant` set to `classic` and `file` containing actual `.png` image for new skin.
- Response:

```json
{
  "id": "be8dfdb5f72644a79ac9e218a4b3fc83",
  "name": "ejaussie",
  "skins": [
    {
      "id": "bb20bdaa-3eee-425f-860a-c38db7300257",
      "state": "ACTIVE",
      "url": "http://textures.minecraft.net/texture/b215f9c99e6c4ccf6200e6157eefd350710fd15cf6a4007136ed9e029196f261",
      "variant": "CLASSIC"
    }
  ],
  "capes": [
    {
      "id": "5af20372-79e0-4e1f-80f8-6bd8e3135995",
      "state": "ACTIVE",
      "url": "http://textures.minecraft.net/texture/2340c0e03dd24a11b15a8b33c2a7e9e32abb2051b2481d0ba7defd635ca7a933",
      "alias": "Migrator"
    }
  ]
}
```

- Commentary: Skin was successfully changed to newly uploaded one.


### 10. Address: https://api.minecraftservices.com/entitlements/mcstore
- Request Type: `GET`
- Authorization: Yes
- Response:

```json
{
  "items": [
    {
      "name": "game_minecraft",
      "signature": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjEiLCJ4NXQiOiJJVXRXd1l0clNfSXpJS0piaTZzNGtWaF9FNXMifQ.ewogICJzaWduZXJJZCIgOiAiMjUzNTQyNjk5NDUxMDgyMCIsCiAgIm5hbWUiIDogImdhbWVfbWluZWNyYWZ0Igp9.RUethB1QBE7Mfb7aZ9OBMzVFTSOZVaMaL3169qbewWrBgCpWpntVI5mHUSMPlbTMGsgno1WtcspPC4vqjU4tVihNeNx7DWUkmwbtGGI_hCHL_S9dzoLl9vf3blqV2F3o1IJnKQPZ0lDg2BtPqxOESAywXLTJldHR87TJdC4ijBJRiA7xacjCcl9uxUy2Z6gnfSMpT5FAriNtEpsYP7uwtGYmmmey0lSlCI6ZwPznGrJed5tIDSPB-m3LAgG8scgDWzMc3uAZ22ybic0oaTIacWnG89zIofaPmWwNM8bhR2iKOAXnK1yAdjpiUGqBKD0Heks41VR8Gm-aLnqvceQQj326esuUHs_jHAN8BhecubZz2ByohnckaKJ5HQ2vF5kz_I5_l-OZH1Tj9XzbleN7NKg4LYepVpsfQ71fbNERdd2HhKXmOheQuOljLayd6Pmmq8nm9NVFHIngS5fjjq6CmmFxWn4eOSkqY9QGX6BnT1BkTuiT96JzREkQ4SYdK3NRsIHkBx0qHjxu39X0OFw7KL6i5UGpXkHHoBbG-NuZ0WKtp4wBEKmaQfwtz2eSEUXR-MTZ3a__phi20CMbq5_feHGojpesX-YEYty3XzFI_BJZn_ZFtcyEDqyvyy0Is9HV2nT01eJKBF4zh8KJmzntdprzAs5Ndyf959-e2dseMXs"
    },
    {
      "name": "game_minecraft_bedrock",
      "signature": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjEiLCJ4NXQiOiJJVXRXd1l0clNfSXpJS0piaTZzNGtWaF9FNXMifQ.ewogICJzaWduZXJJZCIgOiAiMjUzNTQyNjk5NDUxMDgyMCIsCiAgIm5hbWUiIDogImdhbWVfbWluZWNyYWZ0X2JlZHJvY2siCn0.WyMdCOILexOPRNhtuPhK39yhD2DNFc3ZxxwHxIIvqc-zzCRqr4UVCe6Mw7ssl3eM_3aUI-foCosqJRc7YbjIlyM-3xVo1s09_707iH1rKAymqUV2_KVxRLjdq4H8RhceGES5AyVJa4nFqcNYJDCE05n-jCCjlaQAOzI8ti7rRP1c5AFCSNRxjE2mR4yzTtGuuknZzwu5y9SWFehpfVxuBGLIA0nvve1KLDAnVJrATGSKFpjm9yClr4BkRXY9cJOLs8BLjlbYOzSDvL9fZuA-Ly3Sn1p4Czzcb5A8mQ4kVJQotQBPrq6e_40w5LrtcZcWJKLuKqUIHd0aGa5x0IOqWgHegzcIZ0JoGbjgrU3MmkApkv7Gt4PEp7z3kjPhRaGsQXN8U8fhtrj6MpKADh8gv5Hm-iEvxtxDcbAzm7EO7GQRPomlwVvrVobL5_jRkAa1TaDBGgt5imKnbzBkYloj7Ny1M81thJTvFXtXYR8p8NGPVp0yDsRFrGeS9_P7ezfNRR9DkO7E07RNeFKrwsQTscmPCBXgjJfupBgox6NbVkJHKvVzxXG9LfrH12fTKr4Z9UI7dkdZS_jO4XZPSzB0dtDji5ZFC8Lj6jTuEzkMB0SydO8vLNyj2RjljYkyQz-4e9TcuAS_eMCzuszNhQrAcWUnRoiZ_TWRbC0jLVUSx4Q"
    },
    {
      "name": "product_minecraft",
      "signature": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjEiLCJ4NXQiOiJJVXRXd1l0clNfSXpJS0piaTZzNGtWaF9FNXMifQ.ewogICJzaWduZXJJZCIgOiAiMjUzNTQyNjk5NDUxMDgyMCIsCiAgIm5hbWUiIDogInByb2R1Y3RfbWluZWNyYWZ0Igp9.AYIwg_wER2AUW1eSCLp07zvc4vY7OxS2Rq7nraTqoDmLE3fxyuAucn3bqMkE4r1syZjVNZsbMMUVbZZYaDukEIccqgbWI1rrkxsAD3_sx_MMG7j5uYfT0dCJy410ZTo5NxydRpabrYrItfAv72CftFgzNE4Xv4Lyp6jwg6e-J5zU3zEKYtHVmy2A1pIzCB4hoHYcqebFrYyd6kO0ktUZTDc183APNZ3pLfF_TNtlOhMa7XPjBdVkdQh1uVxBs7PqF4AfuVJmXkrOcaFNdsyGtOJcp3W7qVxGRwdFfYsb7U4jdrJtKIctClQuLUCxG0OAEksqSPKqGM7y4RfXrX1a4znNMO0sYrFCGCMVE6O0sHV3EnlHnKkTJpVYCbKcxOyoPQsVscOUGHBfS2u-65sckADpnWvns_klJLpmxZN-r4mvKZVC_6R_FkhjSu127Yuq1nLvy_lRJyF27efmAkT0HXQKkf6DEGKmq8drpxwwoyznwpweZHa2f0IKFwf9ZpfMVNYyye8fyN2QR9YNJ0Ic7REFU4eeFDw1Kh7vCmjafVxhUAeCrd4nppXbuwtZ-BmBn5EvlfQ6hFYcpMRRhlBxmWYllHCfHsyvWWEIEPc0ZTXPckTmi7bulx4CTafmDmzDAb7y9KmtGJREUq7tIhLQrLQSWcoiDq1F1ow079rqwZM"
    },
    {
      "name": "product_minecraft_bedrock",
      "signature": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjEiLCJ4NXQiOiJJVXRXd1l0clNfSXpJS0piaTZzNGtWaF9FNXMifQ.ewogICJzaWduZXJJZCIgOiAiMjUzNTQyNjk5NDUxMDgyMCIsCiAgIm5hbWUiIDogInByb2R1Y3RfbWluZWNyYWZ0X2JlZHJvY2siCn0.WvmwhdNDc1CgPlYJyMeJA0A7r9ibof6dcBHI0BKR5ol6i-_TrgIqwcRMwfNaohYxtWC1JvHVbHWqs-c2JcgszqXtFp9AuGpjJhfAam4msFW6gX4Bm1LUdTeli6adGijV2qlOEnHftGbuWVgD40RLZiqk7USrppRyvJvHJt4aDt1gQ_wv0Kl4vErCTGxRa2VrN1ZzflVvt5GXmrorNM328h6GkERI_lQTEvSwj_o-cioqjYPgjjmHm8UsJ4qbXqCy77BbwW4Zplr4kg0F9tRToE6EM8Rr7pSvWdPD1t7b4XzQ5fJdhi3ZB5b7KUcV9cq8oqpvGjrCP6DfJ64_xev5bAjxES1ewVJr4rLIHALPfxYy9AgNBSnSC6qABHXZPeNHHG_v_CT9EUsArC2QEvpV8mT9Eix3U8_OimpPuzlDVjm9N4WEqzqdwaNIum_xgNhqJERouwf0qZpAm7qoA4xt-ICH52DSsye-tG3S9HSQfQn6hQfgkoqOuRqQFnIxxUT8v9yDtGWp7XSlIWqqZ8TrNKrso9pSgwyTksdeq-R9iayp8IHgKAhOSjIf5047k0oXHuB6_9wjaav4RpDmKBaVt_X36-5i8WZRvActWyh3iko6ZN02X_NEYc1ufVQiizN8wJ_Xh16QTtva__MrelvJ9HrhebjIueoSzksuFTiIYrI"
    }
  ],
  "signature": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjEiLCJ4NXQiOiJJVXRXd1l0clNfSXpJS0piaTZzNGtWaF9FNXMifQ.ewogICJlbnRpdGxlbWVudHMiIDogWyB7CiAgICAibmFtZSIgOiAiZ2FtZV9taW5lY3JhZnQiCiAgfSwgewogICAgIm5hbWUiIDogImdhbWVfbWluZWNyYWZ0X2JlZHJvY2siCiAgfSwgewogICAgIm5hbWUiIDogInByb2R1Y3RfbWluZWNyYWZ0IgogIH0sIHsKICAgICJuYW1lIiA6ICJwcm9kdWN0X21pbmVjcmFmdF9iZWRyb2NrIgogIH0gXSwKICAic2lnbmVySWQiIDogIjI1MzU0MjY5OTQ1MTA4MjAiLAogICJuYmYiIDogMTY2MjAzNjcyOSwKICAiZXhwIiA6IDE2NjIyMDk3MDksCiAgImlhdCIgOiAxNjYyMDM2OTA5LAogICJwbGF0Zm9ybSIgOiAiUENfTEFVTkNIRVIiCn0.m2dqaYTUApkkYk-IBOs_Q-_RPN6BwZKSWUmHpHGIXIgPRZHCakE0TyN11EXaCSi5DvC-DnnMcL7YjKYTgpovrbpgP9WxTb9vV_Ju-72ArxwCxmdPFt1-ykzvSdKNQJGLg3zhql4Y4i1bauxYHGOYTAxhDhO9roDiX6_vlApL6uucpC7ATixsZ7DW22tm6uRO70DWwKV94co0S0p4OP2CjFwUaepzgiKga0EU14yKxEoErxCdUrUmAx2o2csvfscHzQCaRsiUb03KHMC_6LzKbERpzNVdJjMIPJFxU4SmdSvWFNMs2Pjh8ClsMDZbyoK2YOjCr8bBC5uU_rwb9skUU4v1fo_s1Sp_UavZG9rsIz9b4ffCFf29QukGr3HEqqB9vkBX317NDa0j0Akdpyez6twbeYGmTtQb7IRiivN_WaV4NwFBxLX5Jvtr0dYwejBisikC04LzBDZeY882A1-1sydIK5xlQkMwsoZCMASY4IzJ1z_RbixVa_vRNW1DJNSHWAIS-toD2kh6OtSBsXf4lZtw67R2rVc70oY6Z0AhGAEOuwJflW_K2iXmkxHLA60Dl8An5smSswlK-prbh8ixQUCwNOGI6NxNiTNM8EFabMnLe5v1w9jIbeX2V4n_ng-PWfLJTiFQ60Iv-JFSrRN81mFED-KGB9pE7eekJCLiLu4",
  "keyId": "1"
}
```


## Conclusions
Analyzing the data presented above, we can easily answer our initial questions.

> 1. Can Mojang's API be used, without account access, to establish username from UUID and vice-versa of the banned user?

As evidenced by requests [1](#user-content-1-address-httpsapimojangcomusersprofilesminecraftejaussie) and [2](#user-content-2-address-httpsapimojangcomuserprofilesbe8dfdb5f72644a79ac9e218a4b3fc83names) - yes. Responses we obtained do not indicate any special behavior with respect to banned accounts.

> 2. Can banned user join online servers on 1.19 and prior?

Considering our attempts to do that in ["Login and authentication"](#user-content-login-and-authentication) section - no. It is also not possible for server to tell that login attempt failed specifically because the user was banned. This is in accordance with my expectations.

> 3. Can banned user join offline servers?

Yes, assuming they can access multiplayer menu. While this is always possible on 1.19 and prior, the game will try to prevent user from accessing that menu on newer versions. Client modification is required in such case, and there already exists [a mod for that purpose](https://github.com/StyStatic/BanScreenPrevention).

This is in accordance with my expectations, since when joining offline servers login sequence never enters a phase where authentication services are communicated with.

> 4. How can fact and details of the ban be established by user?

Through [request to https://api.minecraftservices.com/player/attributes](#user-content-5-address-httpsapiminecraftservicescomplayerattributes). JSON-based response will contain `banStatus -> bannedScopes -> MULTIPLAYER` field with further details about the ban. If user is not currently banned - `bannedScopes` will be empty.

> 5. What data Mojang provides as ban details?

Data we received as response to abovementioned request seems to be exhaustive in this respect:

```json
"bannedScopes": {
  "MULTIPLAYER": {
    "banId": "579aa9f9-8e6c-4151-bbff-69328c22fdaf",
    "scope": "MULTIPLAYER",
    "expires": "2022-09-02T03:52:21.816645Z",
    "reason": "21",
    "reasonMessage": "Harassment or Bullying"
  }
}
```

By looking at it we can draw following conclusions:
1. Each ban has a UUID assigned to it. Presumably this is only used internally by Mojang's services;
2. Each ban has a "scope" of effect. While right now it is always `MULTIPLAYER`, this gives us a subject to speculate on;
3. The user is informed of ban's expiry date. While it allows to establish when the ban will end, this will not let you know when it was issued in case you don't know;
4. Each ban has a "reason" identifier attached to it, which seems to be a numerical ID. Once again, this is not used by Minecraft client, so its purpose is likely internal to Mojang's services;
5. The user is also provided a more readable reason of the ban. It seems to be a short, generic description of offense category that user was banned for.

> 6. Does ban somehow affect other responses to unrelated requests to Mojang's API?

In general, the answer seems to be no. Responses to all requests we have tried to perform indicate no special behavior with respect to banned account.

> 6.1. Can user fetch their keypair (used for chat signing) when banned?

Yes, see [request 7](#user-content-7-address-httpsapiminecraftservicescomplayercertificates).

> 6.2. Can user change their skin when banned?

Yes, see [request 9](#user-content-9-address-httpsapiminecraftservicescomminecraftprofileskins). For reference, the actual Java code used to perform the request was written using Apache's HttpClient 4.3 and HttpMime 4.3:

```java
  CloseableHttpClient httpClient = HttpClients.createDefault();
  HttpPost uploadFile = new HttpPost("https://api.minecraftservices.com/minecraft/profile/skins");
  uploadFile.addHeader("Authorization", "Bearer " + TOKEN);
  MultipartEntityBuilder builder = MultipartEntityBuilder.create();
  builder.addTextBody("variant", "classic", ContentType.TEXT_PLAIN);

  // This attaches the file to the POST:
  File file = new File("../../../dreadlord.png");
  builder.addBinaryBody("file", new FileInputStream(file), ContentType.IMAGE_PNG, file.getName());

  HttpEntity multipart = builder.build();
  uploadFile.setEntity(multipart);
  CloseableHttpResponse response = httpClient.execute(uploadFile);
  HttpEntity responseEntity = response.getEntity();
  String responseString = IOUtils.toString(responseEntity.getContent(), StandardCharsets.UTF_8);

  System.out.println("response: " + responseString);
```

While `FileInputStream` was used in this case, any `InputStream` will do, so long as it supplies valid byte sequence corresponding to the image.

> 7. Is it possible to establish that an account is banned without having access to it?

The answer seems to be no. There is no request that can be performed against Mojang's API without access token that would provide explicit indication whether particular account is banned or not.

> 8. Is it possible for account owner to prove to someone else that their account is banned without sharing their access token?

So far, the answer is no. Keep in mind that the question here is how that can be proved without any trust to third parties involved. To put it another way, is there something that an account owner can do to prove their ban, which a person who falsely claims to be banned cannot do, without providing any degree of access to the account in question? This would be achievable if there was some kind of request anyone can perform to Mojang API to fetch ban status of any user, or if Mojang issued verifiable signatures which could somehow be tied to fact and/or details of the ban. Alas, neither seems to be the case.

*Correction: it might be hypothetically possible if https signature for request responses could be obtained and verified. More research is needed to establish whether such an approach would make sense.*

> 9. With or without access, is it possible to establish that account was banned after the ban already expired?

Regardless of account access - no. After the ban expires there is nothing in responses from Mojang's services that would indicate it ever occured.

While most of the data we obtained simply confirms what was already expected, this research lays an important ground for projects like [Trustless Authentication](https://github.com/Aizistral-Studios/Trustless-Authentication), which have to rely on certain assumptions about how Mojang's services behave with respect to banned accounts. State of things may change in the future, so I also hope to define conclusive set of tests that can be performed on any banned account in the future in order to verify whether answers to questions asked in this research changed.

## Speculations

It would appear that reports are now actioned on, but we cannot know whether that is true for all reports. Considering ejaussie was mostly playing on Realms in days preceeding the ban, it is not unreasonable to assume that only reports from Realms are reviewed at this point. This would make sense, because unlike conventional third party servers - Mojang have full access to Realms, including chat logs, which they can use to directly verify what actually transpired at the time of report. This would also make reports from Realms immune to any evidence-altering exploits with chat reporting, present or future.

While that might sound reassuring with respect to chat reports, it also means that Mojang actively collect and store chat logs from all Realms servers, private or otherwise. It is directly confirmed by [their own statements](https://help.minecraft.net/hc/en-us/articles/8047895358605-Our-Commitment-to-Player-Safety#h_01G95X76WR1PM97XBXDE7G25KE). It is possible, and even likely that ban did not occur due to report at all, but rather due to review of monitored messages directly. Whether that is concerning is in the eye of the beholder.

Considering presence of ban scopes, we can also expect ban types besides `MULTIPLAYER` to be introduced in the future. Will infamous singleplayer bans, which for now remain constrained only to some specific platforms, eventually become a reality for Java edition? I hope not, but unfortunately - hope is best we can have in these dark times.