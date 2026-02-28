---
name: pesquisa-etapas
description: Executa uma pesquisa em etapas usando um fluxo de prompts (papéis/subagentes). Use quando o usuário pedir pesquisa em etapas, pesquisa estruturada, ou seguir o fluxo de prompts de pesquisa. Cada etapa é um papel com instruções em references/.
---

# Pesquisa em Etapas

Esta skill orquestra uma pesquisa seguindo um conjunto de prompts que representam **etapas** ou **papéis** (como subagentes). Você deve executar cada etapa em ordem, lendo o prompt correspondente e agindo conforme as instruções.

## Quando usar

- O usuário pede "pesquisa em etapas", "pesquisa estruturada" ou "seguir o fluxo de pesquisa".
- O usuário menciona os prompts/papéis que você desenvolveu para pesquisa.
- Qualquer tarefa de pesquisa que deva seguir uma sequência definida de papéis (ex.: coletor → revisor → sintetizador).

## Como executar

1. **Ordem fixa**  
   Leia e execute os arquivos em `references/` **na ordem numérica** dos nomes (ex.: `01-coletor.md`, `02-revisor.md`, `03-sintetizador.md`). Cada arquivo é o prompt/instrução de um papel para essa etapa.

2. **Um papel por vez**  
   Para cada etapa:
   - Use a ferramenta `read` para carregar o conteúdo do arquivo em `{baseDir}/references/`.
   - Siga as instruções daquele prompt como se fosse esse papel.
   - Só passe para a próxima etapa após concluir a atual (ou quando o próprio prompt indicar transição).

3. **Caminho dos arquivos**  
   - No ambiente OpenClaw, `{baseDir}` é o diretório desta skill (ex.: `/data/workspace/skills/pesquisa-etapas`).
   - Os prompts ficam em `{baseDir}/references/`. Exemplo: `references/01-coletor.md`.

4. **Resultado**  
   Ao final, entregue o resultado da última etapa (ex.: síntese, relatório) conforme definido nos prompts. Se um prompt pedir para salvar resultados intermediários em arquivos ou memória, faça isso antes de avançar.

## Estrutura esperada em references/

Coloque um arquivo `.md` por etapa, com nome numérico para ordem:

- `01-<nome-do-papel>.md` — primeira etapa (ex.: coletor)
- `02-<nome-do-papel>.md` — segunda etapa (ex.: revisor)
- `03-<nome-do-papel>.md` — terceira etapa (ex.: sintetizador)
- etc.

O conteúdo de cada arquivo é o **prompt/instrução** daquele papel. Você deve seguir esse texto como sistema de instruções para a etapa.

## Resumo

1. Ler `references/01-*.md` e executar como primeiro papel.
2. Ler `references/02-*.md` e executar como segundo papel.
3. Repetir na ordem até a última etapa.
4. Entregar o resultado final ao usuário.
