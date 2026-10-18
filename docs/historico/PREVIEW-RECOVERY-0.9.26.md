# Recuperação da prévia CUDA

Upload, render e recebimento do frame da prévia CUDA têm limite de espera de 15 segundos por requisição. Ao exceder esse tempo, o app aborta a espera HTTP, libera a tarefa da prévia e usa WebGL para o estado mais recente. Uma falha de um frame já ultrapassado também desativa tentativas CUDA automáticas, evitando uma fila de requisições atrás do mesmo render bloqueado. Exportações offline não usam esse limite. O CUDA pode ser selecionado novamente manualmente.

Isso recupera o agendamento e a apresentação; abortar HTTP não interrompe um kernel CUDA que já esteja executando no servidor e não recupera um driver que tenha travado. O halo nas bordas do depth ainda exige reprodução com a imagem e o mapa originais.

Teste automatizado: requisições sem resposta no upload, render e corpo binário, trocas rápidas de modo com depth ativo, atualização após recuperação e ausência de repetição CUDA. Um pedido de exportação demorado também deve completar.

Reset da lente: descarta a espera CUDA da prévia imediatamente, invalida edições e respostas antigas de geometria, cancela gestos em andamento e sincroniza os campos de foco. A restauração da prescrição é uma requisição independente, sem esperar na fila de um ajuste anterior. A prévia usa WebGL após a recuperação; a execução nativa CUDA já iniciada pode continuar no servidor.
