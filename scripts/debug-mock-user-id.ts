/**
 * MOCK_USER_IDの実際の値を確認するデバッグスクリプト
 * 実行方法: npx tsx scripts/debug-mock-user-id.ts
 */

import { MOCK_USER_ID } from '@/lib/mockData';

console.log('🔍 MOCK_USER_IDのデバッグ情報\n');

console.log('値:', MOCK_USER_ID);
console.log('型:', typeof MOCK_USER_ID);
console.log('長さ:', MOCK_USER_ID.length);
console.log('形式チェック:');

// UUID v4の形式チェック (8-4-4-4-12)
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUUID = uuidRegex.test(MOCK_USER_ID);

console.log('  - UUID形式:', isValidUUID ? '✅ 有効' : '❌ 無効');

if (!isValidUUID) {
  console.log('\n❌ MOCK_USER_IDがUUID形式ではありません！');
  console.log('期待値: 00000000-0000-0000-0000-000000000001');
  console.log('実際値:', MOCK_USER_ID);
} else {
  console.log('\n✅ MOCK_USER_IDは正しいUUID形式です');
}
