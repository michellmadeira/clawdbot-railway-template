# ICP/GTM FitBank no HDzinho — armazenar e versionar por SVC

Os documentos de posicionamento (ICP/GTM) do FitBank ficam **apenas no HDzinho** (`/data/workspace` no container) para o OpenClaw acessar. Não há cópia no repositório; edite e versione direto no workspace (ex.: quando o Z: estiver montado).

## Estrutura no HDzinho

```
workspace/docs/fitbank-icp-gtm/
├── svc-1-bancos-fintechs/
│   └── ICP_GTM-FitBank-MercadoFinanceiro-20250908.md   [e futuras versões -YYYYMMDD]
├── svc-2-erps/
│   └── ICP_GTM-FitBank-ERPs-20250919.md
└── svc-3-mercado-capitais/
    └── ICP_GTM-FitBank-MercadoCapitais-20250908.md
```

- **SVC 1** = Bancos e fintechs (Mercado Financeiro)
- **SVC 2** = ERPs e BPO (Gestão)
- **SVC 3** = Mercado de capitais

O banco (`sdria_redacao_svc_20260130`) tem registros com id 1, 2, 3 para esses contextos; `sdria_redacao_20251014.id_svc` referencia qual SVC usar por run.

## Versionamento

- Em cada pasta `svc-*`, use arquivos com sufixo **-YYYYMMDD.md** (ex.: `ICP_GTM-FitBank-ERPs-20260305.md`).
- O mais recente é a versão vigente para gerar SVC e contexto.
- Não apagar versões antigas; manter histórico na pasta.

## Habilidades que usam

- **research-fitbank-0-svc**: gera o SVC a partir do documento da vertical; o input vem de `workspace/docs/fitbank-icp-gtm/svc-<N>/`.
- **research-db-crud**: tabela `sdria_redacao_svc_20260130` guarda o SVC gerado; o id 1, 2 ou 3 corresponde à pasta e à vertical.

## Atualizar sem deploy (como antes)

O **Z:** montado **é** o `/data` do servidor em tempo real. Para atualizar os ICP/GTM **não precisa fazer deploy**: monte o Z: (`.\conectar-webdav-e-abrir.ps1`), abra ou copie os arquivos para **`Z:\workspace\docs\fitbank-icp-gtm\`** (cada um na subpasta svc-1, svc-2, svc-3). O que você gravar ali já aparece pro Claudião. Se der erro “dispositivo não funciona”, desconecte o Z: e monte de novo, depois tente gravar outra vez.

## Seed só na primeira vez

Se a pasta `workspace/docs/fitbank-icp-gtm` **não existir** no servidor, o app no startup copia do repo para lá (uma vez). Depois disso, o fluxo normal é **atualizar via Z:**, sem deploy.

## Resumo

| O quê | Onde |
|-------|------|
| Atualizar (sem deploy) | Montar Z: e editar/copiar em `Z:\workspace\docs\fitbank-icp-gtm\` |
| No servidor (OpenClaw lê) | `workspace/docs/fitbank-icp-gtm/` (svc-1, svc-2, svc-3) |

Documentado para não perder: ICP/GTM no HDzinho; atualização em tempo real via Z:, sem depender de deploy.
