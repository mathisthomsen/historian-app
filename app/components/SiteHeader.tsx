'use client'

import { Stack, Typography, IconButton, Container, Box, Divider } from '@mui/material'
import { ChevronLeft } from '@mui/icons-material'
import { useRouter } from 'next/navigation'

type SiteHeaderProps = {
  title?: string
  showOverline?: boolean
  overline?: string
  children?: React.ReactNode
}
export default function FabMenu({ title, overline, showOverline, children }: SiteHeaderProps){

    const router = useRouter()

    return (
        <Box>
            <Container maxWidth="xl" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 4 }}>
                <Stack direction="column" spacing={0} sx={{ alignItems: 'flex-start' }}>
                    {showOverline && (
                        <Stack direction="row" spacing={1} alignItems="center" sx={{marginLeft: -2}}>
                            <IconButton 
                                onClick={() => router.back()}
                                aria-labelledby='back-label'>
                                <ChevronLeft fontSize='large'/>
                            </IconButton>
                            <Typography variant="overline" component="p" gutterBottom id='back-label'>
                                {overline}
                            </Typography>
                        </Stack>
                    )}

                    <Typography variant="h4" component="h1" >
                        {title}
                    </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                    {children}
                </Stack>
            </Container>
            <Divider sx={{ mt: 2, mb: 2 }} />
        </Box>
    )
}