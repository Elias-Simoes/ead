# Page snapshot

```yaml
- generic [ref=e5]:
  - generic [ref=e6]:
    - heading "Entrar na sua conta" [level=2] [ref=e7]
    - paragraph [ref=e8]:
      - text: Ou
      - link "criar uma nova conta" [ref=e9] [cursor=pointer]:
        - /url: /register
  - generic [ref=e10]:
    - generic [ref=e12]: Falha no login. Verifique suas credenciais.
    - generic [ref=e13]:
      - generic [ref=e14]:
        - generic [ref=e15]: E-mail
        - textbox "E-mail" [ref=e16]: student.e2e@test.com
      - generic [ref=e17]:
        - generic [ref=e18]: Senha
        - textbox "Senha" [ref=e19]: Test123!@#
    - link "Esqueceu sua senha?" [ref=e22] [cursor=pointer]:
      - /url: /forgot-password
    - button "Entrar" [ref=e24] [cursor=pointer]
```