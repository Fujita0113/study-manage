# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e4]:
    - heading "ログイン" [level=1] [ref=e5]
    - generic [ref=e6]:
      - generic [ref=e7]:
        - generic [ref=e8]: メールアドレス
        - textbox "メールアドレス" [active] [ref=e9]:
          - /placeholder: example@email.com
      - generic [ref=e10]:
        - generic [ref=e11]: パスワード
        - textbox "パスワード" [ref=e12]:
          - /placeholder: 8文字以上
          - text: yuma1327
      - button "ログイン" [ref=e13]
    - generic [ref=e14]:
      - link "パスワードを忘れた場合" [ref=e16]:
        - /url: /reset-password
      - generic [ref=e17]:
        - text: アカウントをお持ちでない方は
        - link "サインアップ" [ref=e18]:
          - /url: /signup
  - button "Open Next.js Dev Tools" [ref=e24] [cursor=pointer]:
    - img [ref=e25]
  - alert [ref=e30]
```