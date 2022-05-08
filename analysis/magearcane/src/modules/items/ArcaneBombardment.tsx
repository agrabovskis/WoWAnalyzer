import SPELLS from 'common/SPELLS';
import Analyzer, { Options } from 'parser/core/Analyzer';
import { SELECTED_PLAYER } from 'parser/core/EventFilter';
import Events, { DamageEvent } from 'parser/core/Events';
import { calculateEffectiveDamage } from 'parser/core/EventCalculateLib';
import AbilityTracker from 'parser/shared/modules/AbilityTracker';
import BoringSpellValueText from 'parser/ui/BoringSpellValueText';
import ItemDamageDone from 'parser/ui/ItemDamageDone';
import Statistic from 'parser/ui/Statistic';
import STATISTIC_CATEGORY from 'parser/ui/STATISTIC_CATEGORY';

const HEALTH_THRESHOLD = 0.35;
const DAMAGE_BONUS = 0.8;

class ArcaneBombardment extends Analyzer {
  static dependencies = {
    abilityTracker: AbilityTracker,
  };
  protected abilityTracker!: AbilityTracker;

  bonusDamage = 0;

  constructor(options: Options) {
    super(options);
    this.active = this.selectedCombatant.hasLegendary(SPELLS.ARCANE_BOMBARDMENT);
    this.addEventListener(
      Events.damage.by(SELECTED_PLAYER).spell(SPELLS.ARCANE_BARRAGE),
      this.onBarrageDamage,
    );
  }

  onBarrageDamage(event: DamageEvent) {
    if (!event.hitPoints || !event.maxHitPoints) {
      return;
    }
    const enemyHealth = event.hitPoints / event.maxHitPoints;
    if (enemyHealth <= HEALTH_THRESHOLD) {
      this.bonusDamage += calculateEffectiveDamage(event, DAMAGE_BONUS);
    }
  }

  statistic() {
    return (
      <Statistic category={STATISTIC_CATEGORY.ITEMS} size="flexible">
        <BoringSpellValueText spellId={SPELLS.ARCANE_BOMBARDMENT.id}>
          <ItemDamageDone amount={this.bonusDamage} />
          <br />
        </BoringSpellValueText>
      </Statistic>
    );
  }
}

export default ArcaneBombardment;
