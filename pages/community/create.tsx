import type { NextPage } from 'next'
import {
  FormErrorMessage,
  FormControl,
  Container,
  FormLabel,
  Heading,
  Select,
  Button,
  chakra,
  HStack,
  Input,
  Image,
  Text,
  Flex,
  Box,
  useToast,
  Spinner,
  Link,
} from '@chakra-ui/react'
import Head from 'next/head'
import {
  CommunityCreateDto,
  CommunityAdministratorBase,
  CommunityClientConfigBase,
} from 'governator-sdk';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  useFieldArray,
  useForm,
} from 'react-hook-form';
import * as yup from 'yup';
import { useSession } from 'next-auth/react';
import { discordAxios, privateBaseAxios, privateBaseFetcher } from 'constants/axios';
import React, { useCallback, useState, useEffect } from 'react';
import { FiMinus, FiPlus } from 'react-icons/fi';


const schema = yup.object({
  name: yup.string().required('Community name is required.'),
  administrators: yup
    .array<{
      user_allowlist: Array<number>;
      provider_id: string;
    }>()
    .required('At least one administrator is required.'),
  client_config: yup
    .array<{
      provider_id: string;
      guild_id?: string;
    }>()
    .required('Client config is required.'),
}).required();

interface CommunityForm {
  name: string;
  administrators: Array<{
    user_allowlist: Array<number>;
    provider_id: string;
  }>;
  client_config: Array<{
    provider_id: string;
    guild_id?: string;
  }>;
}

/**
 * TODO(z):
 * - name defaults to discord name.
 * - admin defaults to current user.
 * - investigate adding token stratgies.
 * - add url to add install bot link.
 */
const CreateCommunity: NextPage = () => {
  const { data: session } = useSession();
  const [servers, setServers] = useState<Array<any>>();
  const [noBot, setNoBot] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const toast = useToast();

  useEffect(() => {
    discordAxios(session?.accessToken as string).get(
      '/users/@me/guilds'
    ).then((res) => {
      setServers(res.data);
    });
  }, [session?.accessToken]);

  const onChangeFetchChannels = async (event: any) => {
    try {
      setNoBot(false);
      setLoading(true);
      const ADMIN_PERM = 2147483647;

      if (event.target.value === '---') {
        setError('client_config.0.guild_id', {
          type: 'required',
          message: 'Server is required',
        });
        setValue('name', '');
        return;
      }
      
      const server = servers?.find((server) => server.id === event.target.value);    

      setValue('name', server.name);

      if (server.permissions !== ADMIN_PERM) {
        setError('client_config.0.guild_id', {
          type: 'validate',
          message: 'User is not an administrator of this server',
        });
        return;
      }
      const res = await privateBaseFetcher(
        `/client/discord/${event.target.value}/channels/${session?.discordId}`
      );
      return res.data;
    } catch(e) {
      setNoBot(true);
    } finally {
      setLoading(false);
    }
  };

  const {
    handleSubmit,
    formState: {
      isValid,
      isSubmitting,
      errors
    },
    register,
    control,
    setError,
    setValue,
    getValues
  } = useForm<CommunityForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      client_config: [
        {
          provider_id: 'discord',
        }
      ],
      administrators: [
        {
          user_allowlist: [], // start with user who created the community.
          provider_id: 'discord',
        }
      ],
    }
  });

  const {
    fields,
    append,
    remove
  } = useFieldArray({
    control,
    name: 'administrators'
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await privateBaseAxios.post('/community/create', data);
    } catch (e) {
      console.error(e);
    }
  });

  if (session && session.discordId) {
    setValue('administrators.0.user_allowlist', [session.discordId as number]);
  }
  
  return (
      <Box bg='dark-2' minH='calc(100vh - 60px)'>
        <Head>
          <title>Goverator | Create Community</title>
        </Head>
        <Box
          overflowX='hidden'
          color='gray.100'
          minH='calc(100vh - 60px)'
          bg='dark-2'
        >
          <Container maxW='container.xl'>
            <Flex
              alignItems='center'
              direction='column'
              maxW='2xl'
              fontWeight='600'
              fontSize='2xl'
              bg='dark-1'
              p='2rem 3rem'
              mt='3rem'
              mx='auto'
            >
              <Heading
                mb='1em'
              >Create A Community</Heading>
              <FormControl
                isInvalid={!!errors.client_config}
                mb='2em'
                color='white'
              >
                <FormLabel>Select Your Communities Server</FormLabel>
                
                { servers ? (<Select
                  {...register('client_config.0.guild_id', {
                    onChange: (e) => {
                      onChangeFetchChannels(e);
                    }
                  })}
                  isDisabled={servers.length === 0}
                >
                  <chakra.option
                      color='black'
                      value={undefined}
                  >
                      ---
                  </chakra.option>
                  {servers.map((server) => (
                    <chakra.option
                      key={server.id}
                      color='black'
                      value={server.id}
                    >
                      { server.name }
                    </chakra.option>
                  ))}
                </Select>) : (<Spinner size='md' color='white' />)}
                { loading && (<Text mt='1em' fontSize='.5em'>Checking Server... <Spinner color='white' /></Text>)}
                {errors.client_config
                  && errors.client_config.map(
                    (config, index) => (
                      <FormErrorMessage key={index}>
                        { config.guild_id?.message }
                      </FormErrorMessage>
                    ))}
                { noBot && (<FormErrorMessage><Text>Bot does not appear to be installed on your server. Click <Link color='blue.500' href='#'>here</Link> to add Governator to your server.</Text></FormErrorMessage>)}
              </FormControl>
              { getValues().client_config[0].guild_id && (<FormControl
                isInvalid={!!errors.name}
                mb='2em'
              >
                <FormLabel>Community Name</FormLabel>
                <Input
                  {...register('name')}
                />
                <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
              </FormControl>) }
              {/* <FormControl
                isInvalid={!!errors.administrators}
                mb='2em'
              >
                <HStack
                  align={'center'}
                  mb='1em'
                >
                  <FormLabel>Administrators</FormLabel>
                  <Button
                      onClick={() => {
                        append({ provider_id: 'discord' })
                      }}
                      variant='outline'
                      colorScheme={'green'}
                      size='sm'
                      fontSize='13px'
                      leftIcon={<FiPlus />}
                      fontWeight='400'
                      mr='8px'
                      disabled={fields.length > 8}
                    >
                      Add Administrator
                    </Button>
                  <Button
                    onClick={() => {
                      remove(fields.length - 1);
                    }}
                    variant='outline'
                    colorScheme={'red'}
                    size='sm'
                    fontSize='13px'
                    leftIcon={<FiMinus />}
                    fontWeight='400'
                    mr='8px'
                    disabled={fields.length <= 1}
                  >
                    Remove Administrator
                  </Button>
                </HStack>
                { fields.map((field,index) => (<Input
                  key={field.id}
                  mb='1em'
                  _last={{ mb: '0em'}}
                  {...register(`administrators.0.user_allowlist.${index}` as const)}
                />)) }
                <FormErrorMessage>{
                  errors.administrators && "Must provide at least one administrator."
                }</FormErrorMessage>
              </FormControl> */}
              <Button
                colorScheme='green'
                onClick={onSubmit}
                isLoading={isSubmitting || loading}
                isDisabled={!isValid || loading}
                alignSelf='flex-end'
              >
                Create Community
              </Button>
            </Flex>
          </Container>
        </Box>
      </Box>
  )
}

export default CreateCommunity;
