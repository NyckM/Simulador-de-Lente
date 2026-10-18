# Optica Lab 0.8.5 — difusão e foco por profundidade

A difusão anterior misturava o resultado da lente com um halo retirado do RGB original. Esse caminho ignorava a profundidade e podia devolver textura e silhueta do objeto próximo quando o foco estava no fundo. Agora a difusão é um passe sobre a imagem linear já composta por profundidade. Gotas recebem essa imagem difundida. Nenhum RGB original é usado pelo passe de difusão. Mantém-se a extensão conservadora do fundo introduzida em 0.8.4.

O controle Mistura do efeito continua sendo uma mistura explícita entre entrada e resultado; abaixo de 1, parte da entrada nítida aparece por definição. Para revisar o desfoque completo, use 1. Não houve alteração automática dos projetos salvos.

Teste GPU real: primeiro plano a 2 m, foco a 5 m, textura de linhas no primeiro plano e difusão 0,8. Variação vertical de alta frequência: 0,0117 no caminho antigo e 0,00048 no corrigido. O novo passe não aumenta o detalhe do objeto desfocado. Resultado determinístico entre renders repetidos. 70 regressões existentes passaram. A interface usa URLs de assets versionadas para evitar shader antigo em cache.

Comparativo: ../Difusao-Depth-GPU-0.8.5.png. O fundo oculto ainda é aproximado a partir de RGB + depth; sem teste visual do navegador nesta alteração.
