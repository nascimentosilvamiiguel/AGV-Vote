# Configuração do PocketBase

O site conversa com o PocketBase pelo endereço definido em `pocketbase/root.js`. Este guia lista o que
precisa existir no servidor. **Os nomes dos campos têm que ser exatamente estes**, porque o código
usa esses nomes.

> As regras abaixo usam a sintaxe do PocketBase 0.23 ou mais novo. Confira o campo e a regra de cada
> coleção no painel de administração depois de criar.

## Coleções

### `users` (já existe, coleção de autenticação)

| Campo | Tipo | Observação |
|---|---|---|
| `name` | texto | preenchido a partir do e-mail no primeiro acesso |
| `role` | seleção única | valores: `student`, `leader`, `admin` |

Regras:

| Regra | Valor |
|---|---|
| Criar | `@request.body.email ~ '%@escola.pr.gov.br' && @request.body.role = 'student'` |
| Listar / Ver | `id = @request.auth.id` |
| Atualizar | `id = @request.auth.id && @request.body.role:isset = false` |
| Apagar | vazio com cadeado (só administrador) |

A regra de **criar** é o que impede alguém de se cadastrar já como `leader` ou `admin`. O site também
confere o domínio do e-mail, mas isso é só aviso: quem vale é o servidor. Para promover um aluno a
líder, edite o campo `role` dele no painel.

### `chapas`

| Campo | Tipo | Observação |
|---|---|---|
| `name` | texto, obrigatório | nome da chapa |
| `slogan` | texto | |
| `sobre` | texto | apresentação da chapa |
| `proposals` | **JSON** | lista de `{ "titulo": "...", "texto": "..." }` |
| `integrantes` | JSON | lista de `{ "nome": "...", "cargo": "...", "turma": "..." }` |
| `imagem` | arquivo (um só) | PNG, JPG ou WEBP, até 2 MB |
| `createdby` | relação com `users` | quem cadastrou |

Se o campo `proposals` já existia como texto, troque o tipo para JSON. Os textos antigos continuam
aparecendo (cada linha vira uma proposta).

| Regra | Valor |
|---|---|
| Listar / Ver | vazio (público) |
| Criar | `(@request.auth.role = 'leader' \|\| @request.auth.role = 'admin') && @request.body.createdby = @request.auth.id` |
| Atualizar | `@request.auth.role = 'admin' \|\| createdby = @request.auth.id` |
| Apagar | `@request.auth.role = 'admin'` |

### `votos`

| Campo | Tipo | Observação |
|---|---|---|
| `user` | relação com `users`, obrigatório | quem votou |
| `chapa` | relação com `chapas`, **não obrigatório** | vazio no voto em branco |
| `branco` | booleano | `true` no voto em branco |
| `election_id` | texto, obrigatório | vem de `SITE.eleicaoId` |

**Índice único em (`user`, `election_id`)**: é ele que garante um voto por pessoa. Sem esse índice,
quem abrir o console do navegador consegue votar várias vezes. Em *Índices* da coleção, adicione:

```sql
CREATE UNIQUE INDEX idx_voto_unico ON votos (user, election_id)
```

| Regra | Valor |
|---|---|
| Listar / Ver | `user = @request.auth.id` (cada aluno só enxerga o próprio voto) |
| Criar | `@request.auth.id != '' && @request.body.user = @request.auth.id` |
| Atualizar / Apagar | vazio com cadeado (ninguém altera voto) |

### `resultados` (coleção de visualização, só se `SITE.resultadoParcial` for `true`)

Tipo *View*, com esta consulta:

```sql
SELECT (ROW_NUMBER() OVER()) AS id, election_id, chapa, COUNT(*) AS total
FROM votos
GROUP BY election_id, chapa
```

Regra de listar: `@request.auth.id != ''`. Ela expõe só contagens, nunca quem votou em quem.

### `noticias`

| Campo | Tipo |
|---|---|
| `titulo` | texto, obrigatório |
| `resumo` | texto |
| `corpo` | texto |
| `data` | data |
| `publicado` | booleano |

Regras: Listar / Ver = `publicado = true`; Criar, Atualizar e Apagar = vazio com cadeado (só
administrador, pelo painel).

### `mensagens` (formulário de Suporte)

| Campo | Tipo |
|---|---|
| `nome` | texto, obrigatório |
| `email` | e-mail, obrigatório |
| `assunto` | texto, obrigatório |
| `mensagem` | texto, obrigatório |
| `user` | relação com `users` (opcional) |

Regras: Criar = vazio (qualquer visitante pode enviar); Listar, Ver, Atualizar e Apagar = vazio com
cadeado. Ative o limite de requisições em *Configurações* para segurar spam.

## Dados de exemplo

Em `documentation/dados-de-exemplo/` estão as 4 chapas e as 3 notícias do protótipo, todas
**fictícias**, úteis para ensaiar a apresentação. Cadastre pelo painel (ou pelo formulário de chapa) e
envie as imagens de `assets/chapas/`. Apague tudo antes da eleição de verdade.

## Limites que vale conhecer

- **O voto não é anônimo para quem administra o PocketBase.** A coleção `votos` guarda quem votou e em
  quem. Para uma urna realmente secreta, o certo é separar em duas coleções: uma que registra só *quem*
  votou e outra que guarda só *o voto*, sem ligação entre elas.
- **Chapas novas aparecem na hora** para todos. Se a comissão eleitoral quiser aprovar antes, acrescente
  um campo `aprovada` (booleano) em `chapas` e use `aprovada = true` na regra de Listar / Ver.
- O código do site foi testado contra um PocketBase **simulado** (`tests/e2e.py`), não contra o servidor
  real. Teste o fluxo completo (cadastro, login, voto, voto repetido, formulário de chapa com um líder
  e com um aluno) no seu servidor antes de usar.
