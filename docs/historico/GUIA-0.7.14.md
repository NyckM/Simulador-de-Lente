# Optica Lab 0.7.14 — meus perfis

## Reset do perfil

O botão fica abaixo do seletor e atua no perfil selecionado. Para os perfis de
fábrica, restaura os parâmetros de origem, limpa edições dos vidros e repõe foco,
depth e qualidade/saída padrão. Para um perfil personalizado, restaura o último
snapshot salvo. Imagem/vídeo importados permanecem abertos. O Reset geral continua
separado e retorna ao Double-Gauss padrão.

## Criar e atualizar

Edite a lente visualmente ou pelos controles, escreva um nome e clique em Salvar
novo. Ele aparece em Meus perfis. Atualizar salvo só funciona para perfis pessoais
e substitui a configuração salva daquele perfil; os perfis de fábrica permanecem
intactos. Alterações no trabalho não modificam automaticamente o perfil salvo.

São salvos: modelo-base, alterações dos vidros, todos os controles ópticos, foco,
sensor, diafragma, tratamento do depth, dither/highlights, qualidade da prévia,
qualidade de render, tamanho da saída e FPS. Arquivos de mídia e mapas de depth não
são embutidos. Um perfil que usa depth só o habilita se um mapa estiver carregado.

## Backup e portabilidade

Exportar perfil exporta a configuração atual em JSON, com o nome informado.
Importar perfil valida e adiciona uma nova entrada, sem sobrescrever uma existente.
Perfis ficam no armazenamento local do navegador, nesse endereço do app, e
sobrevivem à atualização da página e ao reinício do servidor. Limpar os dados do
navegador ou usar outro navegador/endereço pode exigir importar o backup JSON.
O ZIP da aplicação não contém seus dados locais; exporte os perfis para guardá-los.
Projetos v06 também carregam a definição do perfil personalizado selecionado.

Validação: snapshots independentes, salvar novo/atualizar, persistência, JSON,
reset dos perfis de fábrica e restauração dos personalizados usando funções reais
do app em teste com UI/rede simuladas. Não foi feito teste de cliques no navegador.

Ctrl+F5 carrega os controles da versão atualizada.
