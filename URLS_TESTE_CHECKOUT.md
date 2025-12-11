# URLs para Teste de Checkout

## Credenciais de Teste
- **Email:** student.e2e@test.com
- **Senha:** Test123!@#

## URLs Disponíveis

### 1. Página de Seleção de Planos
```
http://localhost:5174/plans
```
Esta página lista todos os planos disponíveis e permite selecionar um para ir ao checkout.

### 2. URLs Diretas de Checkout (com IDs válidos)

**Plano 1:**
```
http://localhost:5174/checkout/80850f4b-1c38-4a30-917e-2c93a2abfe2a
```

**Plano 2:**
```
http://localhost:5174/checkout/a7dbfc2f-ad65-4e9f-9c42-af33a3a780b1
```

**Plano 3:**
```
http://localhost:5174/checkout/3371480b-c2e6-418a-a231-b6cef36af75d
```

## Fluxo de Teste

1. Acesse http://localhost:5174/login
2. Faça login com as credenciais acima
3. Acesse http://localhost:5174/plans
4. Selecione um plano
5. Você será redirecionado para a página de checkout
6. Escolha o método de pagamento (Cartão ou PIX)
7. Para cartão, selecione o número de parcelas
8. Clique em "Confirmar Pagamento"

## Observações

- O erro "The requested resource was not found" ocorria porque o ID do plano na URL estava malformado
- Agora você pode usar a página de planos para selecionar um plano válido
- Ou usar uma das URLs diretas listadas acima
