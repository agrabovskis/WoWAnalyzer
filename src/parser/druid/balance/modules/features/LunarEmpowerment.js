import { STATISTIC_ORDER } from 'interface/others/StatisticBox';
import SPELLS from 'common/SPELLS';
import Empowerment from './Empowerment';

class LunarEmpowerment extends Empowerment {

  constructor(...args) {
    super(...args);
    this.empowermentBuff = SPELLS.LUNAR_EMP_BUFF;
    this.empoweredSpell = SPELLS.LUNAR_STRIKE;
    this.empowermentPrefix = 'Lunar';
    this.spellGenerateAmount = 12;
    this.icon = 'ability_druid_eclipse';
  }

  statisticOrder = STATISTIC_ORDER.CORE(5);
}

export default LunarEmpowerment;
