/**
 * MusicFree 网易云音乐插件（简化版）
 * 基于公开API，适配Vela手表端
 */

const BASE_URL = 'https://music.163.com'

// 搜索音乐
async function search(query, page, type) {
  const typeMap = { 'music': 1, 'album': 10, 'artist': 100, 'playlist': 1000 }
  const searchType = typeMap[type] || 1
  const url = `${BASE_URL}/api/search/get/web?s=${encodeURIComponent(query)}&type=${searchType}&offset=${(page - 1) * 20}&total=true&limit=20`

  const resp = await fetch(url, {
    headers: { 'Referer': BASE_URL, 'User-Agent': 'Mozilla/5.0' }
  })
  const data = await resp.json()

  if (data.code !== 200 || !data.result) return { isEnd: true, data: [] }

  return {
    isEnd: data.result.songCount <= page * 20,
    data: (data.result.songs || []).map(s => ({
      id: s.id,
      title: s.name,
      artist: s.artists.map(a => a.name).join('/'),
      album: s.album ? s.album.name : '',
      duration: s.duration / 1000,
      cover: s.album && s.album.artist ? s.album.artist.img1v1Url : ''
    }))
  }
}

// 获取播放地址
async function getMediaUrl(songId) {
  const url = `${BASE_URL}/api/song/enhance/player/url?id=${songId}&ids=%5B${songId}%5D&br=320000`
  const resp = await fetch(url, {
    headers: { 'Referer': BASE_URL, 'User-Agent': 'Mozilla/5.0' }
  })
  const data = await resp.json()
  if (data.data && data.data[0] && data.data[0].url) {
    return data.data[0].url
  }
  return null
}

// 获取歌词
async function getLyric(songId) {
  const url = `${BASE_URL}/api/song/lyric?id=${songId}&lv=1`
  const resp = await fetch(url, {
    headers: { 'Referer': BASE_URL, 'User-Agent': 'Mozilla/5.0' }
  })
  const data = await resp.json()
  if (data.lrc && data.lrc.lyric) {
    return parseLyric(data.lrc.lyric)
  }
  return []
}

// 解析LRC歌词
function parseLyric(lrcText) {
  const lines = lrcText.split('\n')
  const result = []
  const timeReg = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/

  for (const line of lines) {
    const match = timeReg.exec(line)
    if (match) {
      const time = parseInt(match[1]) * 60 + parseInt(match[2]) + parseInt(match[3]) / 1000
      const text = line.replace(timeReg, '').trim()
      if (text) {
        result.push({ time, text })
      }
    }
  }
  return result
}

module.exports = { search, getMediaUrl, getLyric, parseLyric }
