# Optica Lab 0.8.9 — saída uniforme após Reset

O controle de distorção p₂ não tinha valor inicial. O Reset geral e a inicialização enviavam undefined ao uniform float p2, que se tornava NaN no WebGL. Isso invalidava as coordenadas de amostragem e podia transformar o resultado em uma superfície uniforme. Agora p₂ inicia em zero, Reset do perfil também o restaura e o renderer usa zero caso coeficientes de distorção estejam ausentes em configurações antigas.

Reprodução em Chromium/ANGLE D3D11, perfil de teste isolado, com o JavaScript real do aplicativo: antes a saída R tinha apenas valores 17–18 em 8 bits, quase uniforme. Depois, os valores variam de 1 a 165 sem depth e de 4 a 255 com depth no demo padrão. A leitura GPU retornou zero erros. Verificados: abertura, Reset geral, Reset do perfil, depth ligado, configuração antiga sem p₂ e recarregamento dessa configuração. Capturas em ../Browser-Preview-0.8.9-*.png e métricas em ../Browser-Preview-0.8.9.json.

A regressão de navegador roda em um Chromium de teste separado, sem ler dados do navegador do usuário. Requer Playwright apenas no ambiente de desenvolvimento. O teste check_numeric_defaults.js verifica que todos os controles numéricos possuem valores iniciais finitos. Os 70 testes Python e a regressão de cobertura cromática também passaram.

Mantém a correção da cobertura por canal de 0.8.8. Os limites ópticos do protótipo permanecem: atlas de raios traçados pela lente e composição aproximada RGB+depth na imagem.
