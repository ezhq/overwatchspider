/* =============================== License =============================== */
// Copyright (c) 2019, ezhq.
// https://github.com/ezhq/overwatchspider


/* =============================== Run Ready =============================== */
// node 标准库
const fs = require('fs')

// 第三方库
const request = require('syncrequest')
const cheerio = require('cheerio')

// 个人模块
const log = console.log.bind(console)

/* =============================== Bsic Model =============================== */
// ES6 定义 Hero 类
// 全称/类型/简介/技能/年龄/职业/基地/隶属/口头禅/背景故事
class Hero {
    constructor() {
        this.name = ''
        this.englishName = ''
        this.photoSrc = ''
        this.heroUrl = ''
        
        this.type = ''
        this.fullName = ''
        this.age = ''
        this.intro = ''
        this.job = ''
        this.base = ''
        this.from = ''
        this.slogan = ''
        this.story = ''
        this.skill = {}
    }
}

// 防御式编程
// const clean = (inOldHero = {}) => {
//     let oldHero = inOldHero
//     let hero = {
//         name = oldHero.name,
//         englishName = oldHero.englishName,
//         photoSrc = oldHero.photoSrc,
//         heroUrl = oldHero.heroUrl,
        
//         type = oldHero.type,
//         fullName = oldHero.fullName,
//         age = oldHero.age,
//         intro = oldHero.intro,
//         job = oldHero.job,
//         base = oldHero.base,
//         from = oldHero.from,
//         slogan = oldHero.slogan,
//         story = oldHero.story,
//         skill = oldHeroskill,
//     }

//     return hero
// }

// heroFromDiv(inDiv): 从英雄对应 Div 获取英雄基本信息
const heroFromDiv = (inDiv) => {
    let e = cheerio.load(inDiv)

    // 实例化 Hero 对象
    let hero = new Hero()

    // name
    let name = String(e('.portrait-title').text())
    hero.name = name

    // photoSrc
    let photo = e('img')
    let photoSrc = photo.attr('src')
    hero.photoSrc = photoSrc

    // heroUrl
    let heroUrl = e('a').attr('href')
    hero.heroUrl = 'http://ow.blizzard.cn' + heroUrl

    // englishName
    hero.englishName = heroUrl.slice(8)

    return hero
}

// ensurePath(inType, folderName): 确认文件夹路径
const ensurePath = (inType, inFolderName) => {
    let type = inType
    let folderName = inFolderName
    
    if (type === 'cache') {
        let mainFolder = 'Cache'
        let folderPath = 'Cache/' + folderName
    
        // 1.确认并创建父缓存文件夹
        if (!fs.existsSync(mainFolder)) {
            fs.mkdirSync(mainFolder)
        }
    
        // 2.确认并创建子缓存文件夹
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath)
        }
    } else if (type === 'download') {
        let mainFolder = 'Download'
        let folderPath = 'Download/' + folderName
        
        // 1.确认并创建父缓存文件夹
        if (!fs.existsSync(mainFolder)) {
            fs.mkdirSync(mainFolder)
        }
    
        // 2.确认并创建子缓存文件夹
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath)
        }
    }
}

// cacheHeroesUrl(inUrl): 缓存主页面
const cacheHeroesUrl = (inUrl) => {
    let url = inUrl

    // 1.确认缓存路径
    let cacheFolder = 'HeroesHtml'
    ensurePath('cache', cacheFolder)

    // 2.确认缓存文件
    let cacheFilePath = 'Cache/HeroesHtml/Main.html'
    let heroesHtmlCached = fs.existsSync(cacheFilePath)

    if (heroesHtmlCached) {
        let data = fs.readFileSync(cacheFilePath)
        log(`--->缓存跳过：Main.html 主页面缓存存在于 ${cacheFilePath} .`)

        return data
    } else {
        // log(`===>缓存开始：缓存文件 ${cacheFilePath} .`)
        // GET 到 网页内容，并提取出 <body> 标签内容
        let html = request.get.sync(url)
        let body = html.body

        // 写入缓存文件
        fs.writeFileSync(cacheFilePath, body)
        log(`--->缓存完成：Main.html 英雄汇总页面缓存至 ${cacheFilePath} .`)

        return body
    }
}

// heroesFromUrl(inUrl): 获取英雄基本信息
const heroesFromUrl = (inUrl) => {
    let url = inUrl

    // 缓存网页
    let heroesBody = cacheHeroesUrl(url)
    // 格式化 html 缓存文件
    let e = cheerio.load(heroesBody)

    // 筛选并缓存 heroesDivs 的 html 文件
    let heroesList = e('#heroes-selector-container')
    let heroesDivs = heroesList.find("a")
    let heroesDivsCacheFilePath = 'Cache/HeroesHtml/HeroesDivs.html'
    fs.writeFileSync(heroesDivsCacheFilePath, heroesDivs)
    // log('--->heroesDivs.length =', heroesDivs.length)

    // 循环处理 heroesDivs
    let heroes = []
    for (let i = 0; i < heroesDivs.length; i++) {
        let heroDiv = heroesDivs[i]

        // 从 Div 中提取出 hero 对象
        let hero = heroFromDiv(heroDiv)
        heroes.push(hero)
    }

    return heroes
}

// saveHeroes(inHeroes): 保存英雄数据信息至 JSON 文件
const saveHeroes = (inHeroes) => {
    let heroes = JSON.stringify(inHeroes, null, 2)

    // JSON 格式数据（字符串）写入本地文件
    // log('===>数据输出开始: ')
    let heroesJsonFilePath = 'Heroes.json'
    fs.writeFileSync(heroesJsonFilePath, heroes)
    // log('')
    // log('===>英雄数据汇总 输出完毕: 数据文件存放于 ' + heroesJsonFilePath + ' .')
    // log('')
}

// cacheHeroUrl(inEnglishName, inUrl): 缓存英雄个人页面
const cacheHeroUrl = (inEnglishName, inUrl) => {
    let englishName = inEnglishName
    let url = inUrl

    // 1.确认缓存路径
    let cacheFolder = 'HeroHtml'
    ensurePath('cache', cacheFolder)

    // 2.确认缓存文件
    let cacheFilePath = `Cache/HeroHtml/${englishName}.html`
    let heroHtmlCached = fs.existsSync(cacheFilePath)

    if (heroHtmlCached) {
        let data = fs.readFileSync(cacheFilePath)
        log(`--->缓存跳过 ${englishName} 个人页面缓存存在于 ${englishName}.html .`)

        return data
    } else {
        // GET 到英雄个人详情页内容，提取 <body> 内容
        let html = request.get.sync(url)
        let body = html.body
        
        // 写入缓存文件
        fs.writeFileSync(cacheFilePath, body)
        log(`--->缓存完成：${englishName} 个人页面缓存至 ${cacheFilePath} .`)

        return body
    }
}

// heroDetailFromHero(inHero): 获取英雄扩展信息
const heroDetailFromHero = (inHero) => {
    let hero = inHero
    let englishName = hero.englishName
    let url = hero.heroUrl

    // 缓存 hero 网页
    let heroBody = cacheHeroUrl(englishName, url)
    // log('')
    // log('===>英雄缓存完毕： 英雄页面存放于 /Cache/HeroHtml/ .')
    // log('')

    // 格式化 html 缓存文件
    let e = cheerio.load(heroBody)

    // type
    let type = String(e('.hero-detail-role-name').text())
    hero.type = type


    // fullName & age
    // fullName
    let fullNameAge = String(e('.name').find('span').text())

    // 标准化字符串
    let nameHead = fullNameAge.slice(0, 2)
    if(nameHead === '让-' || nameHead === '伊丽' || nameHead === '莫伊') {
        fullNameAge = 'fullName：' + fullNameAge
    }
    // 裁剪 fullName
    let fullName = fullNameAge.split('：')[1]
    fullName = fullName.split(' ')[0]
    fullName = fullName.split('，')[0]
    hero.fullName = fullName
    
    // age
    // let age = fullNameAge.split('，')[1].split('：')[1].slice(0, -1)
    let age = String(fullNameAge.split('：')[2])
    
    let ageTail = age.slice(-1)
    if (ageTail === '月') {
        age = '0.' + age.slice(0, -2)
    } else if (ageTail === '知') {
        age = '未知'
    } else if (ageTail === 'd') {
        age = '未知'
    } else {
        age = age.slice(0, -1)
    }
    hero.age = age

    // intro
    let intro = String(e('.hero-detail-description').text())
    hero.intro = intro

    // job
    let job = String(e('.occupation').find('span').text().split('：')[1])
    hero.job = job

    // base
    let base = String(e('.base').find('span').text().split('：')[1])
    hero.base = base

    // from
    let from = String(e('.affiliation').find('span').text().split('：')[1])
    hero.from = from

    // slogan
    let slogan = String(e('.hero-detail-title', '#story').text())
    slogan = slogan.slice(3, -1)
    hero.slogan = slogan

    // story
    let story = e('p', '.hero-bio-backstory').text()
    hero.story = story

    // skill
    let num = Number(e('.hero-ability').length)

    for(let i = 0; i < num; i++) {
        // create demo object
        let obj = {}
        
        // name
        let name = e('.hero-ability').eq(i).find('h4').text()
        obj['name'] = name
        
        // skill: script
        let script = e('.hero-ability').eq(i).find('p').text()
        obj['script'] = script
        
        // skill: iconLink
        let iconLink = String(e('.hero-ability').eq(i).find('img').attr('src'))
        obj['iconLink'] = iconLink
        
        // add object to hero.skill
        let skillId = String(i + 1)
        hero.skill[skillId] = {}
        hero.skill[skillId] = obj
    }

    return hero
}

// downloadPhotos(inHeroes): 下载英雄个人照片及技能缩略图
const downloadPhotos = (inHeroes) => {
    let heroes = inHeroes
    let mainFolder = 'Img'
    ensurePath('download', mainFolder)

    for (i = 0; i < heroes.length; i++) {
        let hero = heroes[i]
        let englishName = hero.englishName

        // hero photo
        let photoSrc = hero.photoSrc
        let folderName = `Img/${englishName}`
        ensurePath('download', folderName)
        
        let filePath = `Download/Img/${englishName}/photo.png`
        request(photoSrc).pipe(fs.createWriteStream(filePath))
        // log(`--->${englishName} photo download End.`)
        

        // skill icon
        let skills = hero.skill
        let skillKeysNum = Object.keys(skills).length

        for (let i = 1; i <= skillKeysNum; i++) {
            let num = String(i)
            let skillName = skills[num]['name']
            // log(`--->skill ${num} name = ${skillName}.`)
            
            let skillScript = skills[num]['script']
            // log(`--->skill ${num} script = ${skillScript}.`)
            
            let skillIconUrl = skills[num]['iconLink']
            // log(`--->skill ${num} iconUrl = ${skillIconUrl}.`)
            
            let skillIconPath = `Download/Img/${englishName}/${englishName}_skill_${num}.png`
            if(fs.existsSync(skillIconPath)){
                // log(`--->下载跳过：技能缩略图文件 ${englishName}_skill_${num}.png 已存在.`)
            } else {
                request(skillIconUrl).pipe(fs.createWriteStream(skillIconPath))
                // log(`--->skill ${num} download done.`)
            }
        }
        // log(`--->${englishName} ${skillKeysNum} skills icon is done.`)
        log(`--->输出完成：${englishName} 英雄图片及${skillKeysNum}个技能图片.`)
        // log('')
    }

}

/* =============================== Main Model =============================== */
const __main = () => {
    log('===>HeroSpider 启动：')
    log('')
    let heroes = []

    // 英雄基本信息获取
    for (i = 0; i < 1; i++) {
        let heroesUrl = 'http://ow.blizzard.cn/heroes/'
        let heroesInPage = heroesFromUrl(heroesUrl)
        heroes = [...heroes, ...heroesInPage]
    }
    log(`===>获取完毕：英雄基本数据.`)
    log('')

    // 英雄扩展信息获取
    for (i = 0; i < heroes.length; i++) {
    // for (i = 0; i < 2; i++) {
        let hero = heroes[i]
        hero = heroDetailFromHero(hero)

        // log('--->hero =', hero)
        heroes[i] = hero
    }
    log(`===>获取完毕：英雄扩展数据.`)
    log('')
    
    // 英雄所有信息输出到文件
    saveHeroes(heroes)
    log(`===>输出完毕：英雄数据信息.`)
    log('')
    
    // 图片类下载到文件
    downloadPhotos(heroes)
    log(`===>输出完毕：英雄头像及技能图片.`)
    log('')

    // 运行报告
    log('')
    log('===>HeroSpider 运行完毕： 各类输出文件路径如下：')
    log('=>英雄数据汇总信息：/Heroes.json')
    log('=>英雄以及技能图片：/Download/Img/<英雄名称>/')
    log('===>HeroSpider 运行结束，再见！')
    log('')
}

/* =============================== Run Model =============================== */
__main()
