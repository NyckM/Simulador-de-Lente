# Optica Lab 0.4 · edição de superfícies

Execute `Iniciar.cmd` e abra `http://127.0.0.1:8766/`. Esta atualização adiciona edição da prescrição Double-Gauss no painel **O caminho da luz**. Selecione uma superfície no desenho ou na lista, altere curvatura, distância até a próxima superfície, diâmetro ou índice de refração e clique em **Aplicar ao traçado**. O atlas de raios, as PSFs, o diagrama e a distância focal são recalculados com a nova geometria. **Restaurar prescrição** remove todas as edições. O projeto JSON agora salva as edições (`optica-lab/3`) e ainda lê as versões 1 e 2.

O editor trabalha com superfícies esféricas centradas da prescrição LensSim/MIT. Alterações impossíveis ou que bloqueiem o raio paraxial são rejeitadas; ele não mede uma lente real, não oferece superfícies asféricas, descentramento ou inclinação de elementos. O índice `nd` é monocromático; o controle de dispersão continua sendo uma aproximação com Abbe sintético, pois a prescrição não traz dados dos vidros.

## Lacuna para qualidade de produção

O [guia do HiGX Optics](https://higx.net/optics/guide/index.html) descreve lentes com prescrições publicadas, PSFs dependentes de posição e foco, controles criativos ligados à óptica, render de alta qualidade, suavização de cortes internos e dither espacial fixo. O nosso atlas interativo usa 3×3 posições e 64 amostras por cor; a imagem é reconstruída por coleta esparsa. Isso **não** garante discos lisos, oclusão correta nem ausência de flicker. O modo 4K aumenta a resolução de saída, mas não o número de raios por pixel. Os controles de swirl, coma adicional, esférica e CA lateral ainda são deformações aproximadas aplicadas à prévia GPU, separadas das edições reais da prescrição.

DVD Depth, Depth Anything V2/V3 e MoGe geram mapas, mas um único depth por pixel não revela o fundo oculto em movimento. O vídeo exportado é MP4 H.264 8 bits sem áudio; não há EXR, ACES/OCIO, alpha/deep, vetores de movimento ou integração com os hosts. Para chegar ao objetivo do usuário, o próximo marco do motor é um render final separado da prévia, com integração densa da PSF por campo e profundidade, composição/oclusão ordenada, HDR em luz linear e testes temporais em clipes reais. A versão 0.4 não deve ser apresentada como substituta de um plugin de produção.

Validação local: 27 testes de física, atlas e API passaram. A nova edição foi verificada por API e mudança de distância focal/atlas. A ausência de flicker no vídeo do usuário ainda não foi medida; o clipe original não está neste projeto.
