# Cubos Bank API

## Table of contents

- [Overview](#overview)
- [Principais Tecnologias Utilizadas](#principais-tecnologias-utilizadas)
- [Como Iniciar](#como-iniciar)
  - [Pré-requisitos](#pré-requisitos)
  - [Preencher as variáveis de ambiente](#preencher-as-variáveis-de-ambiente)
  - [Instalação de Dependências](#instalação-de-dependências)
  - [Executar as migrations](#executar-as-migrations)
  - [Inicie o Servidor](#inicie-o-servidor)
- [Endpoints da Aplicação](#endpoints-da-aplicação)
  - [Usuários](#usuários)
  - [Autenticação](#autenticação)
  - [Contas](#contas)
  - [Cartões](#cartões)
  - [Transações](#transações)
- [Decisões técnicas](#decisões-técnicas)
  - [Autenticação com a API Compilance](#autenticação-com-a-api-compilance)
  - [Consistência de dados](#consistência-de-dados)
  - [Proteção de Dados Sensíveis](#proteção-de-dados-sensíveis)
  - [Uso do Design Pattern Factory](#uso-do-design-pattern-factory)
- [Testes de Integração](#testes-de-integração)

## Overview
Este repositório contém a Cubos Bank API.

## Principais Tecnologias Utilizadas

**Linguagem**: TypeScript para um código mais robusto e tipado.

**Express**: Framework para Node.js para a criação da API.

**PostgreSQL**: Banco de dados relacional.

**Prisma**: ORM para gerenciamento eficiente do banco de dados.

**Zod**: Biblioteca para validação de dados.

**Bcrypt**: Biblioteca para hash de senhas para garantir segurança no armazenamento de credenciais sensíveis.

**Axios**: Biblioteca para fazer requisições HTTP.

**Pino**: Logger para Node.js para facilitar análise e monitoramento.

## Como Iniciar

### Pré-requisitos

- Node.js (versão >= 22.13)
- npm (versão >= 10.9.2)

### Preencher as variáveis de ambiente
Copie o arquivo de `.env.example` para `.env` e configure as variáveis de ambiente no arquivo `.env`

### Instalação de Dependências
Para instalar as dependências, execute:
```bash
npm i
```

### Executar as migrations 
Caso ainda não tenha o banco de dados para essa aplicação, basta executar todas as migrations:
```bash
npm run prisma:setup
```

### Inicie o Servidor
Execute:
```bash
npm run dev
```
ou use o Docker

```bash
docker build -f Dockerfile.dev -t cubos_bank_api .
```

```bash
docker run -p ${PORT}:4000 cubos_bank_api
```

Para o valor configurado na variável `PORT` é onde a aplicação será executada e estará disponível para acesso `http://localhost:${PORT}`.

**Observação**: No Dockerfile.dev a porta do container está configurado para 4000.

## Endpoints da Aplicação

### Usuários
- **POST** `/people` — Criar usuário
    - O usuário envia:
        - document (documento de identificação)
        - name (nome)
        - password (senha)
    - Verifica se o documento já foi cadastrado.
    - Se não, o documento é validado pela API de Compliance.
    - Caso a validação seja aprovada, o cadastro é efetuado.
    - A senha não é armazenada em texto puro, apenas o hash é salvo no banco.

### Autenticação
- **POST** `/login` — Login
    - O usuário envia:
        - document
        - password
    - O sistema verifica se existe um usuário com esse documento.
    - Se existir, o sistema verifica se a senha informada corresponde ao hash armazenado no banco.
    - Caso seja válida, é gerado um token para autenticação, permitindo acesso às rotas privadas.

### Contas
- **POST** `/accounts`: Criar conta (rota privada, requer token)
    - O usuário envia:
        - branch (agência)
        - account (número da conta)
    - O sistema verifica se já existe uma conta com a mesma combinação branch + account.
    - Caso não exista, a conta é criada.
    - Caso exista, um erro é retornado.

- **GET** `/accounts`: Listar contas (rota privada, requer token)
- **GET** `/accounts/{accountId}/balance`: Consultar saldo da conta (rota privada, requer token)
    - O sistema identifica todas as transações da conta que estão com status `processing` ou `requested`.
    - Essas transações são verificadas e aplicadas conforme necessário para atualizar o saldo.
    - Após a atualização, o saldo final é retornado ao usuário.

### Cartões
- **POST** `/accounts/{accountId}/cards`: Criar cartão (rota privada, requer token)
    - O usuário envia
        - type (tipo do cartão, se `virtual` ou `physical`)
        - number (número do cartão)
        - cvv (cvv)
    - Se o cartão informado for `physical`, é verificado se já existe um cartão desse tipo.
    - Caso haja, é retornado um erro. Caso contrário, prossegue.
    - O sistema verifica se já existe no banco um token correspondente ao cartão informado.
    - Caso não exista, o cartão é criado.
    - O número do cartão e o cvv são tokenizados e salvo no banco o token (identificador do cartão), o blob (dado criptografado que é utilizado na recuperação dos dados do cartão, `number` e `cvv`) os últimos quatro dígitos do cartão e o `type`.

- **GET** `/accounts/{accountId}/cards`: Listar cartões da conta (rota privada, requer token)
    - Ao receber a requisição, o sistema aplica o processo de detokenização sobre o token e o blob de cada cartão.
    - A detokenização permite recuperar o número e o código CVV originais do cartão.


- **GET** `/cards?itemsPerPage={itemsPerPage}&currentPage={currentPage}`: Listar cartões (paginação) (rota privada, requer token)
    - Ao consultar a lista, é aplicada a detokenização para recuperar o cvv originais dos cartões.
    - A lista de cartões é retornada conforme os parâmetros de paginação fornecidos pelo usuário.
    - Caso a paginação não seja informada, são usados os valores padrão: `currentPage = 1` e `itemsPerPage = 10`.


### Transações
Antes de qualquer operação envolvendo transações, o sistema realiza uma verificação preliminar para identificar se existem transações com status diferente de `authorized` que possam ter sido devidamente processadas.
- O sistema verifica todas as transações com status não `authorized` relacionado a  conta.
- É consultado o status na API de Compliance para confirmar se foi o status mudou para `authorized` para cada transação não `authorized`.
- É verificado se a conta possui saldo suficiente para a realização da transação que segue, seguindo a ordem de processar primeiro as transações do tipo `debit` e depois `credit`, da transação mais antiga para a mais atual.
- Se sim, com base nessas verificações, o status da transação é atualizado e o saldo da conta é também atualizado.
- Após essas etapas, o fluxo normal de cada endpoint relacionado a transações é executado.


- **POST** `/accounts/{accountId}/transactions`: Criar transação (rota privada, requer token)
    - O usuário envia:
        - value (valor da transação, positivo para `credit`, negativo para `debit`)
        - description (descrição da transação)
    - Antes de enviar a transação do tipo `debit` para a API de Compliance, o sistema verifica se há saldo suficiente na conta para realizar a operação.
    - Se não houver, retornar erro de saldo insuficiente. Se houver saldo suficiente, o sistema envia um pedido de criação da transação para a API de Compliance, incluindo um ID de idempotência `empontentId`.
    - Após a criação, inicia-se um processo de *polling* para consultar o status da transação, com até `TRANSACTION_COMPILANCE_API_POLLING_MAX_RETRY` tentativas, a cada `TRANSACTION_COMPILANCE_API_POLLING_DELAY_MS` milissegundos.
    - As verificações possíveis são:
        - Se a transação não foi autorizada (`unauthorized`), é retornada uma falha informando que não foi possível realizar a operação.
        - Se a transação foi autorizada (`authorized`), essa informação é retornada e a transação é criada no banco com status autorizado.
        - Se o status permanecer como processando (`processing`), essa informação é retornada e aatualizada no banco com status `processing`.

- **GET** `/accounts/{accountId}/transactions?itemsPerPage={itemsPerPage}&currentPage={currentPage}&type={type}`: Listar transações de uma conta (rota privada, requer token)
    - O sistema busca as transações conforme os filtros e paginação informados.
    - Caso a paginação não seja informada, são usados os valores padrão: `currentPage = 1`, `itemsPerPage = 10` e todos os tipos de transações, seja `credit` ou `debit`.
    - A lista é retornada em ordem decrescente de criação (do mais recente para o mais antigo).
    - Não é retornada as transação de status `requested`, pois são as requisições de não conhecimento da Compilance API.

- **POST** `/accounts/{accountId}/transactions/internal`: Criar transação interna (rota privada, requer token)
    - O sistema verifica se há saldo disponível na conta do proprietário e na conta do recebedor, conforme o tipo da transação.
    - Caso haja saldo suficiente, a transação interna é autorizada.
    - São criadas duas transações independentes, mas relacionadas, uma para cada conta.
    - Na conta do proprietário, a transação original é registrada.
    - Na conta do recebedor, é criada uma transação inversa correspondente.
    - Como é uma transação interna, o saldo no banco é atualizado imediatamente e a transação recebe o status `authorized`.

- **POST** `/accounts/{accountId}/transactions/{transactionId}/revert`: Reverter transação (rota privada, requer token)
    - Verifica se a transação solicitada já foi revertida.
    - Caso já tenha sido revertida, é retornado um erro.
    - Caso não tenha sido revertida, verifica se a transação é interna ou não.
    - Se for transação interna:
        - Verifica se a transação já foi revertida.
        - Caso sim, retorna erro. Caso não, o fluxo prossegue.
        - Verifica, tanto na conta do proprietário quanto na do recebedor, todas as transações em não `authorized`.
        - Verifica se há saldo suficiente na conta onde será realizada a transação do tipo `credit`.
        - Se houver saldo suficiente, cria duas novas transações: uma para a conta do proprietário e outra para a conta do recebedor, ambas com status `authorized`, transferindo os respectivos valores para reverter a operação.
        - Tanto para a transação solicitada como para a transação relacionada, a transação é *flagged* com `isReverte = true`.
    - Se a transação foi externa:
        - Verifica na conta do proprietário todas as transações em não `authorized`.
        - Após a atualização dessas transações, verifica se a transação já foi revertida.
        - Caso tenha sido revertida, é retornado um erro.
        - Caso não tenha sido revertida, prossegue.
        - Se a transação for de débito, verifica se há saldo suficiente na conta para a reversão.
        - Caso não haja saldo, o processo é encerrado.
        - Se houver saldo suficiente, cria-se uma nova transação para a reversão.
        - É realizado um processo de polling para verificar a autorização da nova transação.
        - Se autorizada, a transação recebe status autorizado e o saldo é atualizado.
        - Se não autorizada, retorna um erro.
        - Se o status permanecer como `processing` retorna os dados da transação.
        - Para a transação solicitada reversão a transação é *flagged* com `isReverte = true`.

## Decisões técnicas
### Autenticação com a API Compilance
Para acessar a API de Compliance, é necessário utilizar um token de acesso (`access_token`) em todas as chamadas às rotas privadas.

O processo para obtenção e renovação do `access_token` foi implementado da seguinte forma:
- Para obter o token, primeiramente é solicitado um `authCode`.
- Com o `authCode`, obtém-se o `access_token` e o `refresh_token`.
- Durante o tempo de validade do `access_token`, ele é utilizado para autenticar as requisições à API.
- Quando o `access_token` expira, a interceptação via **Axios** detecta respostas de status `401` da API de Compilance e, então, utiliza o `refresh_token` para obter um novo `access_token` sem precisar repetir o processo inicial.
- Caso o `refresh_token` também expire (status `401` da API de Compilance), o processo completo de autenticação é reiniciado, solicitando novamente o `authCode` para obter o novo `access_token` e o `refresh_token`.

### Consistência de dados
Para garantir que o saldo da conta seja atualizado corretamente quando uma transação é autorizada foi utilizada a funcionalidade de *transactions* do Prisma.

Essa abordagem permite que várias transações sejam executadas dentro de uma única operação atômica, de forma a garantir que:
- Ou todas as operações relacionadas são concluídas com sucesso;
- Ou, em caso de erro em alguma delas, nenhuma alteração é aplicada (*rollback*).

Dessa forma, a consistência das transações com o saldo é preservada, evitando cenários onde poderia causar inconsistências no saldo.

### Proteção de Dados Sensíveis
Considerando que a aplicação lida com dados sensíveis, como senha de login do usuário, número de cartão e CVV, foi adotada a seguinte abordagem para armazenamento seguro:
- Senha de login do usuário: armazenada somente na forma de hash.
- Dados de cartão: o número do cartão e o CVV são tokenizados e no banco é armazenando um token e um *blob* criptografado que representam os dados do cartão, protegendo as informações contra acessos não autorizados.

### Uso do Design Pattern Factory 
A utilização do design pattern Factory facilita a criação de instâncias das classes de *services*, *use-cases*, *repositories*, *controllers* e *infrastructures*.

Essa abordagem padroniza a criação dos objetos, facilitando a injeção de dependências e evitando que a configuração dos objetos seja feita manualmente em vários arquivos, o que dificultaria a manutenção do código.

Ao centralizar essa criação em uma *factory* que retorna as instâncias já configuradas, o código fica mais organizado, modular e testável. Isso também facilita a realização de testes unitários, já que as dependências podem ser facilmente mockadas.

## Testes de Integração
Foram implementados testes de integração para validar o comportamento da aplicação.
Foi utilizado o Jest como framework principal de testes, aliado ao SuperTest para simular requisições HTTP e ao SpyOn para monitorar e inspecionar chamadas de funções durante a execução.


## Para Testes Rápidos da Aplicação
Com o *plugin* REST Client do VSCode é possível utilizar do arquivo `collections.http` para envio das requisições HTTP para a aplicação.

**Autora**: Giselle dos Santos Castro