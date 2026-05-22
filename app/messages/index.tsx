import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  RefreshControl,
  Keyboard,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, Typography } from '../../src/theme';
import { EmptyState, LoadingScreen } from '../../src/components';
import { getMessages, sendMessage } from '../../src/api/customer';
import { timeAgo } from '../../src/utils/format';
import { useBrand } from '../../src/contexts/BrandContext';
import { useRefresh } from '../../src/hooks/useRefresh';
import type { Message } from '../../src/types';

export default function MessagesScreen() {
  const { businessName, primaryColor } = useBrand();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await getMessages();
      const data: Message[] = res.data?.data ?? res.data ?? [];
      setMessages(data.slice().reverse());
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const [refreshing, onRefresh] = useRefresh(fetchMessages);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    setSending(true);
    Keyboard.dismiss();

    try {
      const res = await sendMessage(text);
      const newMsg: Message = res.data?.data ?? res.data ?? {
        id: Date.now(),
        direction: 'outbound' as const,
        body: text,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newMsg]);
      setInputText('');
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch {
    } finally {
      setSending(false);
    }
  }, [inputText, sending]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isOutbound = item.direction === 'outbound';

    return (
      <View
        style={[
          styles.messageRow,
          isOutbound ? styles.messageRowRight : styles.messageRowLeft,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isOutbound
              ? [styles.bubbleOutbound, { backgroundColor: primaryColor }]
              : styles.bubbleInbound,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isOutbound ? styles.messageTextOutbound : styles.messageTextInbound,
            ]}
          >
            {item.body}
          </Text>
        </View>
        <Text
          style={[
            styles.timestamp,
            isOutbound ? styles.timestampRight : styles.timestampLeft,
          ]}
        >
          {timeAgo(item.created_at)}
        </Text>
      </View>
    );
  };

  if (loading) {
    return <LoadingScreen message="Loading messages..." />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>{'←'}</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Messages</Text>
          <Text style={styles.headerSubtitle}>{businessName}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.flex}>
          {messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <EmptyState
                icon={'💬'}
                title="No Messages Yet"
                subtitle={`Start a conversation with ${businessName}`}
              />
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderMessage}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => {
                listRef.current?.scrollToEnd({ animated: false });
              }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={Colors.primary}
                  colors={[Colors.primary]}
                />
              }
            />
          )}
        </View>

        <View style={styles.inputBar}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={Colors.textTertiary}
              multiline
              maxLength={2000}
              editable={!sending}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: primaryColor },
              (!inputText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.7}
          >
            <Text style={styles.sendIcon}>{'↑'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 20,
    color: Colors.text,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  headerSubtitle: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  headerSpacer: {
    width: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  messageRow: {
    marginBottom: Spacing.lg,
    maxWidth: '80%',
  },
  messageRowRight: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  messageRowLeft: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    maxWidth: '100%',
  },
  bubbleOutbound: {
    borderBottomRightRadius: 4,
  },
  bubbleInbound: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  messageText: {
    ...Typography.body,
    lineHeight: 20,
  },
  messageTextOutbound: {
    color: Colors.white,
  },
  messageTextInbound: {
    color: Colors.text,
  },
  timestamp: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  timestampRight: {
    textAlign: 'right',
  },
  timestampLeft: {
    textAlign: 'left',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? Spacing.md : Spacing.sm,
    maxHeight: 120,
  },
  input: {
    ...Typography.body,
    color: Colors.text,
    maxHeight: 100,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendIcon: {
    fontSize: 20,
    color: Colors.white,
    fontWeight: '700',
  },
});
