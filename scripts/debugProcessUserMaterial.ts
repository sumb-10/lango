// scripts/debugSentenceLLM.ts
import { parseTextToSentences, enrichSentencesWithLLM } from '../lib/processUserMaterial';

async function main() {
const start = performance.now();
  const sampleText = `
Par un frais matin d’automne, Daniel quitta son appartement plus tôt que d’habitude et prit le bus en direction de la campagne. Depuis plusieurs mois, il était submergé de travail, entouré de délais interminables et de messages qui exigeaient des réponses immédiates. Il avait l’impression que son esprit était devenu une pièce bruyante où chaque pensée résonnait trop fort. En quête de tranquillité, il décida de retourner dans un petit village au bord d’un lac qu’il aimait beaucoup lorsqu’il était enfant. À mesure que le bus s’éloignait de la ville, les hauts immeubles disparurent, laissant place à des champs d’herbes dorées qui s’étendaient de part et d’autre de la route. Daniel ouvrit la fenêtre et laissa le vent vif caresser son visage, lui rappelant un temps plus simple.

En arrivant au village, il remarqua que peu de choses avaient changé. Les ruelles pavées, la rivière tranquille et les montagnes au loin semblaient presque identiques à ses souvenirs. Il marcha en direction du lac, guidé par l’odeur de la terre humide et des pins. Un vieux ponton en bois avançait au-dessus de l’eau, usé mais toujours solide. Daniel s’assit au bout, laissant ses jambes pendre dans le vide. Le lac était silencieux, hormis le bruit occasionnel d’un poisson sautant près de la surface. En observant l’eau scintillante, il comprit à quel point il avait besoin de ce silence. C’était un silence qui ne paraissait pas vide, mais rassurant — un silence semblable à celui qui précède une belle conversation.

Quelques minutes plus tard, Daniel entendit des pas légers derrière lui. En se retournant, il vit un vieil homme portant une toile et une petite chaise pliante. Il le reconnut immédiatement : c’était le même peintre qu’il avait rencontré des années auparavant lors d’une visite d’enfance. L’homme, qui s’appelait Elias, lui adressa un sourire chaleureux et demanda s’il pouvait s’installer à ses côtés sur le ponton. Au fil de leur conversation, Daniel apprit qu’Elias venait toujours au lac chaque week-end pour peindre les saisons changeantes. Elias parlait lentement, mais avec intention, comme si chaque mot avait été choisi avec soin. Il raconta ses voyages — les forêts tropicales du Brésil, les marchés animés du Maroc, les temples paisibles du Japon. Daniel l’écoutait avec fascination, sentant son imagination s’étendre au-delà de son quotidien.

Après un moment, Elias invita Daniel à regarder de plus près la peinture qu’il était en train de réaliser. La toile représentait le lac baigné par la douce lumière du matin, avec de délicats nuages roses reflétés à la surface. Mais ce qui attira surtout l’attention de Daniel, ce n’était pas seulement la beauté du paysage, mais les émotions subtiles cachées dans la manière de peindre. On y percevait une forme de nostalgie, de patience, et d’acceptation — des qualités que Daniel avait l’impression d’avoir oubliées. Elias expliqua que peindre était pour lui une façon d’observer la vie sans se précipiter. Il encouragea Daniel à trouver sa propre manière de « ralentir », que ce soit à travers l’art, la musique, ou simplement quelques minutes de calme dans un endroit tranquille. Daniel sentit quelque chose s’ouvrir en lui, comme une porte dont il n’avait jamais remarqué la présence.

Alors que le soleil commençait à se coucher, Daniel se leva pour partir. Une lueur orange chaleureuse s’étendit dans le ciel, transformant le lac en un miroir de feu. Il remercia Elias pour la conversation et promit de revenir avant l’hiver. Dans le bus du retour, Daniel observa le paysage défiler d’un œil nouveau. Les champs, les montagnes, même les ombres entre les immeubles lui semblaient différents — remplis de détails auxquels il n’avait jamais prêté attention. Il réalisa que la paix n’était pas un lieu auquel il devait s’échapper, mais une pratique qu’il pouvait cultiver, même au cœur d’une vie bien remplie. Pour la première fois depuis longtemps, il se sentit plein d’espoir, comme si le rythme silencieux du lac l’avait accompagné jusqu’à chez lui.

  `;

  const sentences = parseTextToSentences(sampleText);
  console.log('▶ Parsed sentences:');
  console.dir(sentences, { depth: null });

  const enriched = await enrichSentencesWithLLM(sentences);
  console.log('\n▶ Enriched sentences:');
  console.dir(enriched, { depth: null });

  const end = performance.now();
  const seconds = (end - start) / 1000;
  console.log(`\n⏱ Total elapsed time: ${seconds.toFixed(2)} seconds`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
