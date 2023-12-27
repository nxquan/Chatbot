import {View, Text, TouchableOpacity, TouchableHighlight} from 'react-native';
import React from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {colors} from '../../constants/colors';
import firestore from '@react-native-firebase/firestore';

type Props = {
  data: any;
  currentConversationId: string;
  onChangeConversation: (conversationId: any) => void;
  onChangeRefreshing: () => void;
  conversations: string[];
};
const ChatItem = (props: Props) => {
  const {
    data,
    currentConversationId,
    onChangeConversation,
    onChangeRefreshing,
    conversations,
  } = props;

  const handleDeleteConversation = async () => {
    const conversationId = data.id;
    const res = await firestore()
      .collection('messages')
      .where('conversationId', '==', conversationId)
      .get();

    await Promise.all(
      res.docs.map(async doc => {
        await firestore().collection('messages').doc(doc.id).delete();
      }),
    );
    await firestore().collection('conversations').doc(data.id).delete();
    onChangeRefreshing();
    if (conversations.length > 0) {
      onChangeConversation(conversations[0]);
    } else {
      onChangeConversation(undefined);
    }
  };

  return (
    <TouchableHighlight
      onPress={() => {
        onChangeConversation(data.id);
      }}
      className="flex-row items-center mb-1 bg-gray-100 px-1.5 py-2.5 rounded-lg"
      style={
        currentConversationId === data.id && {
          backgroundColor: 'rgba(0,0,0,0.15)',
        }
      }
      underlayColor={'rgba(0,0,0,0.2)'}>
      <>
        <MaterialCommunityIcons
          name="message-outline"
          size={24}
          color={colors.black}
        />
        <Text
          className="flex-1 ml-1 mr-3 text-sm font-normal text-black"
          numberOfLines={1}>
          {data.content}
        </Text>
        <TouchableOpacity
          onPress={() => {
            handleDeleteConversation();
          }}>
          <FontAwesome name="trash-o" size={24} color={colors.primary} />
        </TouchableOpacity>
      </>
    </TouchableHighlight>
  );
};

export default ChatItem;
