# Scanner Quant 6.8.4 — Demo pública

Radar somente leitura: https://thuliomag.github.io/monitor-global-demo/

Carteira/Swing usam decisões da versão 6.8.4. Apenas index.html e demo-data.json entram no deploy; nenhum arquivo da carteira, compra, quantidade, stop pessoal, alerta privado ou credencial é copiado do sistema privado.

Esta demo exibe um snapshot sanitizado. Recarregar busca o arquivo publicado, não faz uma nova coleta de mercado. A data dos dados aparece no painel. Atualizações exigem publicar um novo snapshot validado; a coleta horária do sistema privado não sincroniza automaticamente este repositório público.

O workflow valida o payload antes do deploy no Pages já existente, sem solicitar habilitação administrativa nem credenciais adicionais. Scripts e arquivos de versões antigas são preservados como histórico e não entram no site publicado.

Não é uma carteira online, não gerencia posições e não envia notificações pessoais. Os sinais não são ordens nem garantia de retorno.
