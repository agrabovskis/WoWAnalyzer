import { formatPercentage } from 'common/format';
import SPELLS from 'common/SPELLS';
import Analyzer, { SELECTED_PLAYER } from 'parser/core/Analyzer';
import { calculateEffectiveHealing } from 'parser/core/EventCalculateLib';
import Events, { HealEvent } from 'parser/core/Events';
import { Options } from 'parser/core/Module';
import Combatants from 'parser/shared/modules/Combatants';
import BoringSpellValueText from 'parser/ui/BoringSpellValueText';
import ItemPercentHealingDone from 'parser/ui/ItemPercentHealingDone';
import Statistic from 'parser/ui/Statistic';
import STATISTIC_CATEGORY from 'parser/ui/STATISTIC_CATEGORY';
import STATISTIC_ORDER from 'parser/ui/STATISTIC_ORDER';

import { PHOTO_INCREASED_RATE } from '../../constants';
import { isFromExpiringLifebloom } from '../../normalizers/CastLinkNormalizer';

const PHOTOSYNTHESIS_HOT_INCREASE = 0.2;
// Spring blossoms double dips, confirmed by Bastas
const PHOTOSYNTHESIS_SB_INCREASE = 0.44;

/**
 * Photosynthesis (Talent) :
 * While your Lifebloom is on yourself, your periodic heals heal 20% faster.
 * While your Lifebloom is on an ally, your periodic heals on them have a 5% chance to cause it to bloom.
 */
class Photosynthesis extends Analyzer {
  static dependencies = {
    combatants: Combatants,
  };

  protected combatants!: Combatants;

  /** Total healing from randomly procced blooms */
  extraBloomHealing = 0;
  /** Total healing from increased HoT rate due to LB on self */
  increasedRateHealing = 0;
  /** Number of random blooms */
  randomProccs = 0;

  constructor(options: Options) {
    super(options);

    this.active = this.selectedCombatant.hasTalent(SPELLS.PHOTOSYNTHESIS_TALENT.id);

    this.addEventListener(
      Events.heal.by(SELECTED_PLAYER).spell(PHOTO_INCREASED_RATE),
      this.onHastedHeal,
    );
    this.addEventListener(
      Events.heal.by(SELECTED_PLAYER).spell(SPELLS.LIFEBLOOM_BLOOM_HEAL),
      this.onLifebloomProc,
    );
  }

  onLifebloomProc(event: HealEvent) {
    if (!isFromExpiringLifebloom(event)) {
      this.randomProccs += 1;
      this.extraBloomHealing += event.amount + (event.absorbed || 0);
    }
  }

  onHastedHeal(event: HealEvent) {
    if (
      this.selectedCombatant.hasBuff(
        SPELLS.LIFEBLOOM_HOT_HEAL.id,
        null,
        0,
        0,
        this.selectedCombatant.id,
      ) ||
      this.selectedCombatant.hasBuff(
        SPELLS.LIFEBLOOM_DTL_HOT_HEAL.id,
        null,
        0,
        0,
        this.selectedCombatant.id,
      )
    ) {
      const spellId = event.ability.guid;
      if (spellId === SPELLS.REGROWTH.id && !event.tick) {
        return; // don't want to count Regrowth direct
      }
      const increase =
        spellId === SPELLS.SPRING_BLOSSOMS.id
          ? PHOTOSYNTHESIS_SB_INCREASE
          : PHOTOSYNTHESIS_HOT_INCREASE;
      this.increasedRateHealing += calculateEffectiveHealing(event, increase);
    }
  }

  get totalHealing(): number {
    return this.extraBloomHealing + this.increasedRateHealing;
  }

  get percentHealing(): number {
    return this.owner.getPercentageOfTotalHealingDone(this.totalHealing);
  }

  get selfLifebloomUptime(): number {
    return (
      this.selectedCombatant.getBuffUptime(
        SPELLS.LIFEBLOOM_HOT_HEAL.id,
        this.selectedCombatant.id,
      ) +
      this.selectedCombatant.getBuffUptime(
        SPELLS.LIFEBLOOM_DTL_HOT_HEAL.id,
        this.selectedCombatant.id,
      )
    );
  }

  get totalLifebloomUptime(): number {
    return Object.values(this.combatants.players).reduce(
      (uptime, player) =>
        uptime +
        player.getBuffUptime(SPELLS.LIFEBLOOM_HOT_HEAL.id) +
        player.getBuffUptime(SPELLS.LIFEBLOOM_DTL_HOT_HEAL.id),
      0,
    );
  }

  get othersLifebloomUptime(): number {
    return this.totalLifebloomUptime - this.selfLifebloomUptime;
  }

  statistic() {
    return (
      <Statistic
        position={STATISTIC_ORDER.OPTIONAL(50)}
        category={STATISTIC_CATEGORY.TALENTS}
        size="flexible"
        tooltip={
          <>
            Your Lifebloom was active on others{' '}
            <strong>
              {formatPercentage(this.othersLifebloomUptime / this.owner.fightDuration)}%
            </strong>{' '}
            of the time:
            <ul>
              <li>
                <strong>{this.randomProccs}</strong> extra blooms
              </li>
              <li>
                <strong>
                  {formatPercentage(
                    this.owner.getPercentageOfTotalHealingDone(this.extraBloomHealing),
                  )}
                  %
                </strong>{' '}
                total healing from extra blooms
              </li>
            </ul>
            Your Lifebloom was active on yourself{' '}
            <strong>
              {formatPercentage(this.selfLifebloomUptime / this.owner.fightDuration)}%
            </strong>{' '}
            of the time:
            <ul>
              <li>
                <strong>
                  {formatPercentage(
                    this.owner.getPercentageOfTotalHealingDone(this.increasedRateHealing),
                  )}
                  %
                </strong>{' '}
                total healing from faster ticking HoTs
              </li>
            </ul>
          </>
        }
      >
        <BoringSpellValueText spellId={SPELLS.PHOTOSYNTHESIS_TALENT.id}>
          <ItemPercentHealingDone amount={this.totalHealing} />
          <br />
        </BoringSpellValueText>
      </Statistic>
    );
  }
}

export default Photosynthesis;
