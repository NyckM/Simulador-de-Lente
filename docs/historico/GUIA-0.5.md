# Optica Lab 0.5 · editor visual da lente

Abra `http://127.0.0.1:8766/` após executar `Iniciar.cmd`. Em **O caminho da luz**, clique em uma superfície para selecioná-la. As alças coloridas alteram:

- **Verde:** diâmetro livre da superfície, arrastando para cima ou para baixo.
- **Azul:** raio de curvatura, arrastando horizontalmente. O movimento foi atenuado para ajuste fino.
- **Laranja:** espaçamento da superfície selecionada em relação à anterior, arrastando horizontalmente. A primeira superfície é a referência fixa; nas demais, o movimento altera a espessura da superfície anterior e desloca as superfícies posteriores.

A curva e os campos numéricos respondem imediatamente ao ponteiro. Um endpoint leve recalcula os raios durante a edição; o atlas GPU usa menos raios enquanto você arrasta e volta à qualidade completa ao soltar. As PSFs de diagnóstico também são atualizadas após a edição. As mudanças são guardadas no projeto JSON `optica-lab/3`. **Restaurar prescrição** recupera a Double-Gauss original.

O editor usa a prescrição pública LensSim/MIT e superfícies esféricas centradas. Uma superfície alterada pode continuar limitada pela abertura das superfícies vizinhas. A interface limita raios de curvatura, espessuras e diâmetros e rejeita prescrições cujo raio paraxial não atravesse a lente; ainda não permite inclinação, descentralização, asféricos ou escolha de vidros catalogados. A prévia GPU permanece experimental e não garante ausência de flicker ou oclusão de produção. Consulte [GUIA-0.4.md](GUIA-0.4.md) para esses limites.
