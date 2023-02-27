import { discordAxios } from 'constants/axios'
import { useAtom } from 'jotai'
import { serversAtom } from 'atoms'
import { useState, useCallback, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'

/**
 * @important to remove in the future
 * hardcode BOT GARAGE's server id as allowed
 * included the server name for readability in case we have more to whitelist
 */
const MVP_ALLOWED_GUILDS = {
  "The DAO Bot Garage": "851552281249972254",
  "Bankless DAO": "834499078434979890"
};

const useServers = (mvp = true) => {
  const { data: session } = useSession()
  const [servers, setServers] = useAtom(serversAtom)
  const [loading, setLoading] = useState(false)
  const [retry, setRetry] = useState(0)

  const router = useRouter()
  const guildId = router.asPath.length >= 3 ? router.asPath.split('/')[2] : ''
  const currentServer = servers.find(s => s.id === guildId)

  const getUserGuilds = useCallback(async () => {

    const fetchData = async () => {
      try {
        const data = await discordAxios(session?.accessToken as string).get(
          '/users/@me/guilds'
        )
        console.log(mvp);
        const serversData = mvp ? data.data.filter( (_guild: { id: string }) => Object.values(MVP_ALLOWED_GUILDS).includes(_guild.id)) : data.data
        setServers(serversData)
        return true
      } catch (e) {
        console.log({ e })
        return false;
      }
    };

    if (!servers.length) {
      setLoading(true)
      const succeeded = await fetchData()
      if (!succeeded) {
        if (retry < 4) {
          setTimeout(fetchData, 500);
          setRetry(retry + 1)
        } else {
          signOut()
        }
      } else {
        setLoading(false)
      }
    }
  }, [servers])

  useEffect(() => {
    getUserGuilds()
  }, [getUserGuilds])

  return { loading, servers, currentServer }
}

export default useServers
