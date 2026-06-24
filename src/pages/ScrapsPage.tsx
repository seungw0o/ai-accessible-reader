import { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import type { ArticleData } from '../types';
import { categoryValues, type CategoryValue, type Translation } from '../i18n';

interface ScrapsPageProps {
  scraps: ArticleData[];
  onReadScrap: (scrap: ArticleData) => void;
  onDeleteScrap: (url: string) => void;
  copy: Translation['scrapsPage'];
  categoryLabels: Translation['categories'];
}

export function ScrapsPage({
  scraps,
  onReadScrap,
  onDeleteScrap,
  copy,
  categoryLabels,
}: ScrapsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<CategoryValue>('전체');
  
  // 검색어 필터링
  let filteredScraps = scraps.filter((scrap) => 
    scrap.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (scrap.summary && scrap.summary.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 폴더별 필터링
  if (selectedFolder !== '전체') {
    filteredScraps = filteredScraps.filter((scrap) => scrap.category === selectedFolder);
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="end" wrap="wrap" gap="sm">
        <Box>
          <Title order={2} size="h3">
            {copy.title}
          </Title>
          <Text c="dimmed">{copy.description}</Text>
        </Box>
        <TextInput 
          placeholder={copy.searchPlaceholder} 
          aria-label={copy.searchAria} 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
        />
      </Group>

      {/* 카테고리 폴더 탭 단추들 */}
      <Group gap="xs" wrap="wrap">
        {categoryValues.map((folder) => {
          const count = folder === '전체' 
            ? scraps.length 
            : scraps.filter(s => s.category === folder).length;
          
          // 스크랩된 글이 없는 카테고리는 가독성을 위해 화면에서 숨김 (전체 및 기타는 항상 유지)
          if (folder !== '전체' && folder !== '기타' && count === 0) return null;

          return (
            <Button
              key={folder}
              variant={selectedFolder === folder ? 'filled' : 'light'}
              color="blue"
              size="xs"
              onClick={() => setSelectedFolder(folder)}
              radius="xl"
            >
              {categoryLabels[folder]} ({count})
            </Button>
          );
        })}
      </Group>

      {filteredScraps.length === 0 ? (
        <Paper p="xl" radius="md" withBorder style={{ textAlign: 'center' }}>
          <Text c="dimmed">
            {searchQuery 
              ? copy.noSearchResults 
              : selectedFolder !== '전체' 
              ? copy.emptyFolder(categoryLabels[selectedFolder]) 
              : copy.empty}
          </Text>
        </Paper>
      ) : (
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
          {filteredScraps.map((scrap) => (
            <Card key={scrap.url || scrap.title} radius="md" withBorder>
              <Stack gap="sm" style={{ height: '100%', justifyContent: 'space-between' }}>
                <Stack gap="xs">
                  <Badge w="fit-content" variant="light">
                    {categoryLabels[(scrap.category || '기타') as CategoryValue] || scrap.category || categoryLabels['기타']}
                  </Badge>
                  <Text fw={700} lineClamp={2}>{scrap.title}</Text>
                  {scrap.summary && (
                    <Text size="sm" c="dimmed" lineClamp={3}>
                      {scrap.summary}
                    </Text>
                  )}
                  <Text size="xs" c="dimmed" mt="auto">
                    {copy.savedDate(scrap.date)}
                  </Text>
                </Stack>
                <Group grow gap="xs" mt="md">
                  <Button variant="light" onClick={() => onReadScrap(scrap)}>
                    {copy.readAgain}
                  </Button>
                  <Button variant="outline" color="red" onClick={() => scrap.url && onDeleteScrap(scrap.url)}>
                    {copy.delete}
                  </Button>
                </Group>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
export default ScrapsPage;
