import React, {useState, useCallback, useEffect} from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import OutsidePressHandler from 'react-native-outside-press';
import uuid from 'react-native-uuid';
import firestore from '@react-native-firebase/firestore';
import {GiftedChat} from 'react-native-gifted-chat';

import {colors} from './constants/colors';
import ModalPopper from './components/ModalPopper';
import ChatItem from './components/ChatItem';
import {
  renderAvatar,
  renderBubble,
  renderInputToolbar,
  scrollToBottomComponent,
} from './Utils';

export function Chat() {
  const [conversations, setConversations] = useState<any>([]);
  const [currentConversationId, setCurrentConversationId] =
    useState<any>(undefined);
  const [messages, setMessages] = useState<any>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onSend = async (messages: any[]) => {
    const currentMessage = messages[0];
    const data = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: currentMessage.text,
        },
      ],
    };

    const userMessageId: any = uuid.v4(); //messageId
    await firestore()
      .collection('messages')
      .doc(userMessageId)
      .set({
        ...currentMessage,
        conversationId: currentConversationId,
        _id: userMessageId,
      });

    await firestore()
      .collection('conversations')
      .doc(currentConversationId)
      .update({
        content: currentMessage.text,
      });

    setMessages((previousMessages: any) =>
      GiftedChat.append(previousMessages, messages),
    );

    setLoading(true);
    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer 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`,
      },
      body: JSON.stringify(data),
    })
      .then(res => res.json())
      .then(async (data: any) => {
        const systemMessages = data.choices.map((item: any) => {
          const assistantMessageId: any = uuid.v4(); //messageId
          const data = {
            _id: assistantMessageId,
            text: item.message.content,
            createdAt: new Date(),
            user: {
              _id: 2,
              name: item.message.role,
              avatar: 'https://cdn-icons-png.flaticon.com/512/8943/8943377.png',
            },
          };
          return data;
        });

        await Promise.all(
          systemMessages.map(async (item: any) => {
            await firestore()
              .collection('messages')
              .doc(item._id)
              .set({
                ...item,
                conversationId: currentConversationId,
                _id: item._id,
              });
          }),
        );

        setMessages((previousMessages: any) =>
          GiftedChat.append(previousMessages, [...systemMessages]),
        );
        setLoading(false);
      })
      .catch(error => {
        Alert.alert('API của OpenAI bị giới hạn 3 request / phút');
        setLoading(false);
      });
    setRefreshing(!refreshing);
  };

  const onChangeConversation = useCallback((id: any) => {
    setCurrentConversationId(id);
    setTimeout(() => {
      setShowHistoryModal(false);
    }, 200);
  }, []);

  const onChangeRefreshing = useCallback(() => {
    setRefreshing(prev => !prev);
  }, []);

  const handleAddNewConversation = async () => {
    const _id: any = uuid.v4(); //conversationId
    await firestore()
      .collection('conversations')
      .doc(_id)
      .set({
        content: 'New chat',
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'assistant',
          avatar: 'https://cdn-icons-png.flaticon.com/512/8943/8943377.png',
        },
      });

    await firestore()
      .collection('messages')
      .add({
        _id: uuid.v4(),
        conversationId: _id,
        text: 'Hello! How can I assist you today?',
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'assistant',
          avatar: 'https://cdn-icons-png.flaticon.com/512/8943/8943377.png',
        },
      });

    setMessages([
      {
        _id: _id,
        text: 'Hello! How can I assist you today?',
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'assistant',
          avatar: 'https://cdn-icons-png.flaticon.com/512/8943/8943377.png',
        },
      },
    ]);
    setCurrentConversationId(_id);
  };

  useEffect(() => {
    const fetchConversation = async () => {
      const res = await firestore().collection('conversations').get();
      const data: any = res.docs.map(doc => {
        const timestamp = doc.data().createdAt;
        const milliseconds =
          timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000;
        const date = new Date(milliseconds);
        return {id: doc.id, ...doc.data(), createdAt: date};
      });
      data.sort((a: any, b: any) => {
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

      if (data.length === 0) {
        handleAddNewConversation();
      } else {
        setCurrentConversationId(data[data.length - 1].id);
      }
      setConversations(data);
    };
    fetchConversation();
  }, [refreshing]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (currentConversationId) {
        const res = await firestore()
          .collection('messages')
          .where('conversationId', '==', currentConversationId)
          .get();
        const data: any = res.docs.map(doc => {
          const timestamp = doc.data().createdAt;
          const milliseconds =
            timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000;
          const date = new Date(milliseconds);
          return {id: doc.id, ...doc.data(), createdAt: date};
        });
        data.sort((a: any, b: any) => {
          return a.createdAt.getTime() - b.createdAt.getTime();
        });
        setMessages(data);
      } else {
        setMessages([]);
      }
    };
    fetchMessages();
  }, [currentConversationId]);

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-row items-center px-5 py-3 border-b border-b-orange-200">
        <TouchableOpacity
          onPress={() => {
            setShowHistoryModal(true);
          }}>
          <Entypo name="chat" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg text-black font-bold">
          Chatbot
        </Text>
        <TouchableOpacity onPress={() => {}}>
          <AntDesign name="setting" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <View className="flex-1 justify-center">
        <GiftedChat
          isTyping={loading}
          messagesContainerStyle={{paddingVertical: 24}}
          //Required
          onSend={messages => onSend(messages)}
          messages={messages}
          user={{
            _id: 1,
            name: 'user',
            avatar: '',
          }}
          //Optional
          renderAvatar={renderAvatar}
          renderBubble={renderBubble}
          renderInputToolbar={renderInputToolbar}
          showUserAvatar
          alwaysShowSend={true}
          showAvatarForEveryMessage={false}
          timeFormat="LTS"
          dateFormat="L"
          scrollToBottom={true}
          scrollToBottomComponent={scrollToBottomComponent}
        />
      </View>

      <ModalPopper visible={showHistoryModal} transparent={true}>
        <OutsidePressHandler
          className="flex-1"
          onOutsidePress={() => {
            setShowHistoryModal(false);
          }}>
          <View className="flex-1 px-2 pt-4">
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {conversations.map((con: any, index: number) => {
                return (
                  <ChatItem
                    key={con.id}
                    data={con}
                    onChangeConversation={onChangeConversation}
                    currentConversationId={currentConversationId}
                    onChangeRefreshing={onChangeRefreshing}
                    conversations={conversations}
                  />
                );
              })}
            </ScrollView>
            <View className="bg-gray-50 border-t border-t-orange-100 p-3">
              <TouchableOpacity
                onPress={() => {
                  handleAddNewConversation();
                  setShowHistoryModal(false);
                  setRefreshing(!refreshing);
                }}
                activeOpacity={0.4}>
                <View
                  className="flex-row justify-center items-center rounded-lg py-1.5"
                  style={{backgroundColor: colors.primary}}>
                  <Text className="text-base text-white mr-2">New Chat</Text>
                  <MaterialCommunityIcons
                    name="message-outline"
                    size={24}
                    color={colors.white}
                  />
                </View>
              </TouchableOpacity>
              <Text className="text-center text-sm mt-2">Version 1.0.0</Text>
            </View>
          </View>
        </OutsidePressHandler>
      </ModalPopper>
    </SafeAreaView>
  );
}
