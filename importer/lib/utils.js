const characterVariants = [
  ['匯', '滙'],
  ['荔', '茘'],
  ['恥', '耻'],
  ['柏', '栢'],
  ['群', '羣'],
  ['裡', '裏'],
  ['峰', '峯'],
  ['略', '畧'],
  ['雞', '鷄'],
  ['霸', '覇'],
  ['杆', '桿'],
  ['恒', '恆'],
  ['叠', '疊'],
  ['果', '菓'],
  ['村', '邨'],
  ['闊', '濶'],
  ['剋', '尅'],
  ['匹', '疋'],
  ['強', '强'],
  ['烟', '煙'],
  ['廠', '厰'],
  ['廈', '厦'],
  ['同', '仝'],
  ['竪', '豎'],
  ['筍', '笋'],
  ['疴', '痾'],
  ['腳', '脚'],
  ['卻', '却'],
  ['衛', '衞'],
  ['杯', '盃'],
  ['場', '塲'],
  ['吊', '弔'],
  ['雕', '鵰'],
  ['鈎', '鉤'],
  ['劫', '刦', '刧'],
  ['册', '冊'],
  ['罵', '駡'],
  ['麵', '麪'],
  ['升', '昇', '陞'],
  ['嫻', '嫺'],
  ['敍', '叙', '敘'],
  ['啟', '啓']];

const replaceVairant = (name) => {
  let output = name;
  characterVariants.forEach((v) => {
    output = output.replace(v[1], v[0]);
    if (v.length > 1) {
      output = output.replace(v[2], v[0]);
    }
  });
  return output;
};

const nameMatch = (name, nameToFound) => nameToFound !== '' && (
  name === nameToFound
  || name === nameToFound.trim()
  || replaceVairant(name) === replaceVairant(nameToFound)
);

module.exports = {
  replaceVairant,
  nameMatch,
};
